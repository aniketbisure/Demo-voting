'use server'

import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Poll, { IPoll } from '@/models/Poll';
import { getRedisClient } from '@/lib/redis';

// Helper to convert File to Base64 string
async function fileToBase64(file: File): Promise<string> {
    if (!file || !file.name || file.size === 0) return '';
    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        return `data:${file.type || 'image/png'};base64,${base64}`;
    } catch (error) {
        console.error("Error converting file to base64:", error);
        return '';
    }
}

export async function createPoll(formData: FormData) {
    try {
        await connectDB();

        console.log("Starting createPoll with MongoDB...");
        const title = formData.get('title') as string;
        const subTitle = formData.get('subTitle') as string;
        const partyName = formData.get('partyName') as string;
        const votingDateRaw = formData.get('votingDate') as string;
        const blueInfoText = (formData.get('blueInfoText') as string) || "";
        const yellowTitleText = (formData.get('yellowTitleText') as string) || "";
        const yellowFooterText = (formData.get('yellowFooterText') as string) || "";
        const showCandidateImages = formData.get('showCandidateImages') === 'true';
        const contactNumber = (formData.get('contactNumber') as string) || "";
        const customMessage = (formData.get('customMessage') as string) || "";

        // Handle Main Symbol
        const symbolFile = formData.get('mainSymbolFile') as File;
        const mainSymbolUrl = await fileToBase64(symbolFile);

        // Format Date
        let votingDate = votingDateRaw;
        if (votingDateRaw) {
            const [year, month, day] = votingDateRaw.split('-');
            votingDate = `मतदान दि.- ${day}/${month}/${year} रोजी स. ७. ३० ते सायं. ५. ३० पर्यंत`;
        }

        // Parse candidates with Parallel Image Processing
        const candidatePromises = [];
        let i = 0;

        while (formData.has(`candidateName_${i}`)) {
            const index = i;
            candidatePromises.push((async () => {
                const name = formData.get(`candidateName_${index}`) as string;
                const seat = formData.get(`candidateSeat_${index}`) as string;
                const serialNumber = formData.get(`candidateSr_${index}`) as string;
                const headerMessage = formData.get(`candidateHeaderMsg_${index}`) as string;

                const candidateImageFile = formData.get(`candidateImage_${index}`) as File;
                // For create, we don't have existing URLs, but follow same logic.
                let candidateSymbolUrl = await fileToBase64(candidateImageFile);
                if (!candidateSymbolUrl) candidateSymbolUrl = mainSymbolUrl;

                const candidatePartySymbolFile = formData.get(`candidatePartySymbol_${index}`) as File;
                let partySymbolUrl = await fileToBase64(candidatePartySymbolFile);
                if (!partySymbolUrl) partySymbolUrl = mainSymbolUrl;

                if (name) {
                    return {
                        seat: seat || (index + 1).toString(),
                        name,
                        serialNumber: serialNumber || (index + 1).toString(),
                        symbolUrl: candidateSymbolUrl,
                        partySymbolUrl: partySymbolUrl,
                        headerMessage,
                        bgColor: '#fff'
                    };
                }
                return null;
            })());
            i++;
        }

        const resolvedCandidates = await Promise.all(candidatePromises);
        const candidates = resolvedCandidates.filter((c) => c !== null);

        const id = Math.random().toString(36).substring(7).toUpperCase();

        const newPoll = new Poll({
            id,
            title,
            subTitle,
            partyName,
            mainSymbolUrl,
            ogImage: mainSymbolUrl,
            votingDate,
            blueInfoText,
            yellowTitleText,
            yellowFooterText,
            showCandidateImages,
            contactNumber,
            customMessage,
            candidates
        });

        await newPoll.save();
        console.log("Poll saved to MongoDB with ID:", id);

        redirect(`/demo/${id}`);
    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') throw error;
        console.error("CRITICAL ERROR in createPoll:", error);
        throw error;
    }
}

export async function getAllPolls() {
    try {
        await connectDB();
        // 1. Fetch from MongoDB
        const mongoPolls = await Poll.find({}).sort({ createdAt: -1 }).lean();
        const mongoPollsPlain = JSON.parse(JSON.stringify(mongoPolls));

        // 2. Fetch from Legacy (Redis/JSON) for backward compatibility
        const redis = await getRedisClient();
        const keys = await redis.keys('poll:*');
        const legacyPolls = [];

        for (const key of keys) {
            const id = key.replace('poll:', '');
            // Skip if this poll ID is already in MongoDB (migrated)
            if (mongoPollsPlain.some((p: any) => p.id === id)) continue;

            const data = await redis.get(key);
            if (data) {
                legacyPolls.push(JSON.parse(data));
            }
        }

        // 3. Merge and Sort
        const allPolls = [...mongoPollsPlain, ...legacyPolls];
        allPolls.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return allPolls;
    } catch (error) {
        console.error("Error in getAllPolls:", error);
        return [];
    }
}

export async function getPoll(id: string) {
    try {
        await connectDB();
        // 1. Try MongoDB
        const poll = await Poll.findOne({ id }).lean();
        if (poll) {
            return JSON.parse(JSON.stringify(poll));
        }

        // 2. Failover to Legacy (Redis/JSON)
        const redis = await getRedisClient();
        const data = await redis.get(`poll:${id}`);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Error in getPoll:", error);
        return null;
    }
}

export async function deletePoll(id: string) {
    try {
        await connectDB();

        // Try delete from MongoDB
        const result = await Poll.deleteOne({ id });

        // Also try delete from Legacy (cleanup even if not migrated, or if it exists in both)
        const redis = await getRedisClient();
        await redis.del(`poll:${id}`);

    } catch (error) {
        console.error("Error in deletePoll:", error);
    }
}

export async function updatePoll(id: string, formData: FormData) {
    try {
        await connectDB();

        let existingPoll = await Poll.findOne({ id });
        let isLegacy = false;

        if (!existingPoll) {
            // Check legacy storage
            const redis = await getRedisClient();
            const data = await redis.get(`poll:${id}`);
            if (data) {
                // Keep the raw object first, we will transform it to Mongoose doc or object
                // Since we want to SAVE to Mongo, we should create a new Poll instance with this data
                const legacyData = JSON.parse(data);
                existingPoll = new Poll(legacyData);
                isLegacy = true;
            }
        }

        if (!existingPoll) throw new Error("Poll not found");

        const title = formData.get('title') as string;
        const subTitle = formData.get('subTitle') as string;
        const partyName = formData.get('partyName') as string;
        const votingDateRaw = formData.get('votingDate') as string;
        const blueInfoText = formData.get('blueInfoText') as string;
        const yellowTitleText = formData.get('yellowTitleText') as string;
        const yellowFooterText = formData.get('yellowFooterText') as string;
        const showCandidateImages = formData.get('showCandidateImages') === 'true';
        const contactNumber = (formData.get('contactNumber') as string) || "";
        const customMessage = (formData.get('customMessage') as string) || "";

        // Handle Main Symbol
        const symbolFile = formData.get('mainSymbolFile') as File;
        let mainSymbolUrl = existingPoll.mainSymbolUrl;

        const newSymbolBase64 = await fileToBase64(symbolFile);
        if (newSymbolBase64) {
            mainSymbolUrl = newSymbolBase64;
        }

        // Format Date
        let votingDate = votingDateRaw;
        // Simple check if it's in YYYY-MM-DD format to convert
        if (votingDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(votingDateRaw)) {
            const [year, month, day] = votingDateRaw.split('-');
            votingDate = `मतदान दि.- ${day}/${month}/${year} रोजी स. ७. ३० ते सायं. ५. ३० पर्यंत`;
        }

        // Parse candidates with Parallel Image Processing
        const candidatePromises = [];
        let i = 0;

        while (formData.has(`candidateName_${i}`)) {
            const index = i;
            // Create a closure to capture 'index'
            candidatePromises.push((async () => {
                const name = formData.get(`candidateName_${index}`) as string;
                const seat = formData.get(`candidateSeat_${index}`) as string;
                const serialNumber = formData.get(`candidateSr_${index}`) as string;
                const headerMessage = formData.get(`candidateHeaderMsg_${index}`) as string;

                const candidateImageFile = formData.get(`candidateImage_${index}`) as File;
                const existingSymbolUrl = formData.get(`candidateExistingSymbol_${index}`) as string;

                const candidatePartySymbolFile = formData.get(`candidatePartySymbol_${index}`) as File;
                const existingPartySymbolUrl = formData.get(`candidateExistingPartySymbol_${index}`) as string;

                // 1. Candidate Symbol
                // Try new upload -> then existing URL -> then fallback to Main Symbol
                let candidateSymbolUrl = existingSymbolUrl;
                const newCandBase64 = await fileToBase64(candidateImageFile);
                if (newCandBase64) {
                    candidateSymbolUrl = newCandBase64;
                }
                if (!candidateSymbolUrl) candidateSymbolUrl = mainSymbolUrl;

                // 2. Party Symbol
                let partySymbolUrl = existingPartySymbolUrl;
                const newPartyBase64 = await fileToBase64(candidatePartySymbolFile);
                if (newPartyBase64) {
                    partySymbolUrl = newPartyBase64;
                }
                if (!partySymbolUrl) partySymbolUrl = mainSymbolUrl;

                if (name) {
                    return {
                        seat: seat || (index + 1).toString(),
                        name,
                        serialNumber: serialNumber || (index + 1).toString(),
                        symbolUrl: candidateSymbolUrl,
                        partySymbolUrl: partySymbolUrl,
                        headerMessage,
                        bgColor: '#fff'
                    };
                }
                return null;
            })());
            i++;
        }

        const resolvedCandidates = await Promise.all(candidatePromises);
        const candidates = resolvedCandidates.filter((c) => c !== null);

        // Update fields
        existingPoll.title = title;
        existingPoll.subTitle = subTitle;
        existingPoll.partyName = partyName;
        existingPoll.mainSymbolUrl = mainSymbolUrl;
        existingPoll.ogImage = mainSymbolUrl;
        existingPoll.votingDate = votingDate;
        existingPoll.blueInfoText = blueInfoText;
        existingPoll.yellowTitleText = yellowTitleText;
        existingPoll.yellowFooterText = yellowFooterText;
        existingPoll.showCandidateImages = showCandidateImages;
        existingPoll.contactNumber = contactNumber;
        existingPoll.customMessage = customMessage;
        existingPoll.candidates = candidates;

        // If it was legacy, this is a new document created via `new Poll(...)`.
        // If it was existing Mongo doc, it's that doc.
        // `save()` works for both.
        await existingPoll.save();

        if (isLegacy) {
            // Remove from old storage to complete migration
            const redis = await getRedisClient();
            await redis.del(`poll:${id}`);
            console.log(`Migrated poll ${id} from Legacy to MongoDB`);
        }

        redirect(`/demo/${id}`);
    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') throw error;
        console.error("Error in updatePoll:", error);
        throw error;
    }
}

export async function toggleCandidateImages(id: string, currentState: boolean) {
    try {
        await connectDB();

        // Try Mongo first
        const poll = await Poll.findOne({ id });
        if (poll) {
            poll.showCandidateImages = !currentState;
            await poll.save();
            return poll.showCandidateImages;
        }

        // Fallback to legacy
        const redis = await getRedisClient();
        const data = await redis.get(`poll:${id}`);
        if (data) {
            const legacyPoll = JSON.parse(data);
            legacyPoll.showCandidateImages = !currentState;
            await redis.set(`poll:${id}`, JSON.stringify(legacyPoll));
            return legacyPoll.showCandidateImages;
        }

    } catch (error) {
        console.error("Error toggling images:", error);
    }
}
