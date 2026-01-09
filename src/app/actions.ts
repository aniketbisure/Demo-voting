'use server'

import { put } from '@vercel/blob';
import { getRedisClient } from '@/lib/redis';
import { redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';

async function uploadImage(file: File): Promise<string> {
    if (!file || !file.name || file.size === 0) return '';

    // Check if Vercel Blob token exists
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const blob = await put(file.name, file, {
                access: 'public',
                addRandomSuffix: true,
            });
            return blob.url;
        } catch (err) {
            console.error("Vercel Blob upload failed, falling back to local:", err);
        }
    }

    // Fallback to local storage in public/uploads
    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        return `/uploads/${filename}`;
    } catch (err) {
        console.error("Local upload failed:", err);
        return '';
    }
}

export async function createPoll(formData: FormData) {
    try {
        console.log("Starting createPoll...");
        const title = formData.get('title') as string;
        const subTitle = formData.get('subTitle') as string;
        const partyName = formData.get('partyName') as string;
        const votingDateRaw = formData.get('votingDate') as string;
        const blueInfoText = (formData.get('blueInfoText') as string) || `डेमो मतदानासाठी ${partyName} निशाणी समोरील निळे बटण दाबावे`;
        const yellowTitleText = (formData.get('yellowTitleText') as string) || `मतदानाच्या दिवशी सुद्धा "${partyName}" पक्षाचे लोकप्रिय उमेदवार`;
        const yellowFooterText = (formData.get('yellowFooterText') as string) || "यांना त्यांच्या नाव व चिन्हासमोरील बटन दाबून प्रचंड मताने विजयी करा!";
        const showCandidateImages = formData.get('showCandidateImages') === 'true';

        console.log("Form data parsed. Uploading main symbol...");
        // Handle File Upload
        const symbolFile = formData.get('mainSymbolFile') as File;
        const mainSymbolUrl = await uploadImage(symbolFile);
        console.log("Main symbol URL:", mainSymbolUrl);

        // Format Date: YYYY-MM-DD -> मतदान दि.- DD/MM/YYYY
        let votingDate = votingDateRaw;
        if (votingDateRaw) {
            const [year, month, day] = votingDateRaw.split('-');
            votingDate = `मतदान दि.- ${day}/${month}/${year} रोजी स. ७ ते सायं. ६ पर्यंत`;
        }

        // Parse candidates from form data
        const candidates = [];
        let i = 0;
        while (formData.has(`candidateName_${i}`)) {
            const name = formData.get(`candidateName_${i}`) as string;
            const seat = formData.get(`candidateSeat_${i}`) as string;
            const serialNumber = formData.get(`candidateSr_${i}`) as string;
            const candidateImageFile = formData.get(`candidateImage_${i}`) as File;

            console.log(`Processing candidate ${i}: ${name}`);
            let candidateSymbolUrl = await uploadImage(candidateImageFile);
            if (!candidateSymbolUrl) {
                candidateSymbolUrl = mainSymbolUrl;
            }

            const candidatePartySymbolFile = formData.get(`candidatePartySymbol_${i}`) as File;
            let partySymbolUrl = await uploadImage(candidatePartySymbolFile);

            // If no specific party symbol, fallback to main party symbol?
            // User requested "add its party logo", so if not provided, maybe main symbol is good default OR blank.
            // Let's default to mainSymbolUrl if not provided, consistent with current behavior of "symbol" column.
            if (!partySymbolUrl) {
                partySymbolUrl = mainSymbolUrl;
            }

            if (name) {
                candidates.push({
                    seat: seat || (i + 1).toString(),
                    name,
                    serialNumber: serialNumber || (i + 1).toString(),
                    symbolUrl: candidateSymbolUrl, // This is the candidate PHOTO
                    partySymbolUrl: partySymbolUrl, // This is the new candidate PARTY SYMBOL
                    bgColor: '#fff'
                });
            }
            i++;
        }

        const id = Math.random().toString(36).substring(7).toUpperCase();

        const newPoll = {
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
            candidates
        };

        console.log("Saving poll to Redis with ID:", id);
        // Save to Redis
        const redis = await getRedisClient();
        await redis.set(`poll:${id}`, JSON.stringify(newPoll));
        console.log("Poll saved. Redirecting...");

        redirect(`/demo/${id}`);
    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') throw error; // Re-throw Next.js redirect errors
        console.error("CRITICAL ERROR in createPoll:", error);
        throw error;
    }
}

export async function getAllPolls() {
    try {
        const redis = await getRedisClient();
        const keys = await redis.keys('poll:*');
        const polls = [];

        for (const key of keys) {
            const data = await redis.get(key);
            if (data) {
                polls.push(JSON.parse(data));
            }
        }

        return polls;
    } catch (error) {
        console.error("Error in getAllPolls:", error);
        return [];
    }
}

export async function getPoll(id: string) {
    try {
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
        const redis = await getRedisClient();
        await redis.del(`poll:${id}`);
    } catch (error) {
        console.error("Error in deletePoll:", error);
    }
}

export async function updatePoll(id: string, formData: FormData) {
    try {
        const title = formData.get('title') as string;
        const subTitle = formData.get('subTitle') as string;
        const partyName = formData.get('partyName') as string;
        const votingDateRaw = formData.get('votingDate') as string;
        const blueInfoText = formData.get('blueInfoText') as string;
        const yellowTitleText = formData.get('yellowTitleText') as string;
        const yellowFooterText = formData.get('yellowFooterText') as string;
        const showCandidateImages = formData.get('showCandidateImages') === 'true';

        // Existing data
        const redis = await getRedisClient();
        const existingData = await redis.get(`poll:${id}`);
        const existingPoll = existingData ? JSON.parse(existingData) : null;

        if (!existingPoll) throw new Error("Poll not found");

        // Handle File Upload
        const symbolFile = formData.get('mainSymbolFile') as File;
        let mainSymbolUrl = existingPoll.mainSymbolUrl;

        const newSymbolUrl = await uploadImage(symbolFile);
        if (newSymbolUrl) {
            mainSymbolUrl = newSymbolUrl;
        }

        // Format Date: YYYY-MM-DD -> मतदान दि.- DD/MM/YYYY
        // If it's already in the display format, we might need to handle it.
        // In edit mode, we'll probably pass the raw date if we can.
        let votingDate = votingDateRaw;
        if (votingDateRaw && votingDateRaw.includes('-')) {
            const [year, month, day] = votingDateRaw.split('-');
            votingDate = `मतदान दि.- ${day}/${month}/${year} रोजी स. ७ ते सायं. ६ पर्यंत`;
        }

        // Parse candidates from form data
        const candidates = [];
        let i = 0;
        while (formData.has(`candidateName_${i}`)) {
            const name = formData.get(`candidateName_${i}`) as string;
            const seat = formData.get(`candidateSeat_${i}`) as string;
            const serialNumber = formData.get(`candidateSr_${i}`) as string;
            const candidateImageFile = formData.get(`candidateImage_${i}`) as File;
            const existingSymbolUrl = formData.get(`candidateExistingSymbol_${i}`) as string;
            const candidatePartySymbolFile = formData.get(`candidatePartySymbol_${i}`) as File;
            const existingPartySymbolUrl = formData.get(`candidateExistingPartySymbol_${i}`) as string;

            let candidateSymbolUrl = existingSymbolUrl || mainSymbolUrl;
            const newCandImage = await uploadImage(candidateImageFile);
            if (newCandImage) {
                candidateSymbolUrl = newCandImage;
            }

            let partySymbolUrl = existingPartySymbolUrl || mainSymbolUrl;
            const newPartySymbol = await uploadImage(candidatePartySymbolFile);
            if (newPartySymbol) {
                partySymbolUrl = newPartySymbol;
            }

            if (name) {
                candidates.push({
                    seat: seat || (i + 1).toString(),
                    name,
                    serialNumber: serialNumber || (i + 1).toString(),
                    symbolUrl: candidateSymbolUrl,
                    partySymbolUrl: partySymbolUrl,
                    bgColor: '#fff'
                });
            }
            i++;
        }

        const updatedPoll = {
            ...existingPoll,
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
            candidates
        };

        await redis.set(`poll:${id}`, JSON.stringify(updatedPoll));
        redirect(`/demo/${id}`);
    } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') throw error;
        console.error("Error in updatePoll:", error);
        throw error;
    }
}
export async function toggleCandidateImages(id: string, currentState: boolean) {
    try {
        const redis = await getRedisClient();
        const data = await redis.get(`poll:${id}`);
        if (!data) return;

        const poll = JSON.parse(data);
        poll.showCandidateImages = !currentState;

        await redis.set(`poll:${id}`, JSON.stringify(poll));
        return poll.showCandidateImages;
    } catch (error) {
        console.error("Error toggling images:", error);
    }
}
