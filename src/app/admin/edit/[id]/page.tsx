'use client';

import React, { useState, useEffect } from 'react';
import { updatePoll, getPoll } from '../../../actions';
import styles from '../../../page.module.css';
import { Plus, Trash2, Vote, Calendar, Image as ImageIcon, Briefcase, Type, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface CandidateRow {
    name: string;
    seat: string;
    sr: string;
    imagePreview: string | null;
    existingSymbolUrl?: string;
    partySymbolPreview: string | null;
    existingPartySymbolUrl?: string;
    headerMessage?: string;
}

export default function EditPollPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [poll, setPoll] = useState<any>(null);
    const [candidates, setCandidates] = useState<CandidateRow[]>([]);
    const [symbolPreview, setSymbolPreview] = useState<string | null>(null);

    useEffect(() => {
        const loadPoll = async () => {
            const data = await getPoll(id);
            if (!data) {
                router.push('/admin');
                return;
            }
            setPoll(data);
            setSymbolPreview(data.mainSymbolUrl);

            // Map candidates
            const mappedCandidates = data.candidates.map((c: any) => ({
                name: c.name,
                seat: c.seat,
                sr: c.serialNumber,
                imagePreview: c.symbolUrl,
                existingSymbolUrl: c.symbolUrl,
                partySymbolPreview: c.partySymbolUrl,
                existingPartySymbolUrl: c.partySymbolUrl,
                headerMessage: c.headerMessage || ''
            }));
            setCandidates(mappedCandidates);
            setLoading(false);
        };
        loadPoll();
    }, [id]);

    const addCandidate = () => {
        setCandidates([...candidates, { name: '', seat: '', sr: (candidates.length + 1).toString(), imagePreview: null, partySymbolPreview: null, headerMessage: '' }]);
    };

    const removeCandidate = (index: number) => {
        if (candidates.length > 1) {
            const newCandidates = [...candidates];
            newCandidates.splice(index, 1);
            setCandidates(newCandidates);
        }
    };

    const updateCandidate = (index: number, field: keyof CandidateRow, value: string | null) => {
        const newCandidates = [...candidates];
        (newCandidates[index] as any)[field] = value;
        setCandidates(newCandidates);
    };

    const handleCandidateImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateCandidate(index, 'imagePreview', reader.result as string);
                // When a new file is selected, we clear the existingSymbolUrl for this row
                updateCandidate(index, 'existingSymbolUrl', '');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCandidatePartySymbolChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateCandidate(index, 'partySymbolPreview', reader.result as string);
                updateCandidate(index, 'existingPartySymbolUrl', '');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSymbolPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Helper to extract date in YYYY-MM-DD from the formatted string
    const extractDate = (dateStr: string) => {
        // Look for DD/MM/YYYY
        const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) {
            return `${match[3]}-${match[2]}-${match[1]}`;
        }
        return new Date().toISOString().split('T')[0];
    };

    if (loading) return <div className={styles.main}><div className={styles.container}>Loading...</div></div>;

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <Link href="/admin" className={styles.addButton} style={{ position: 'absolute', left: '20px', top: '20px' }}>
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <Vote className={styles.headerIcon} />
                    <h1 className={styles.title}>पोल संपादित करा</h1>
                    <p className={styles.subtitle}>ID: {id} साठी माहिती अद्ययावत करा</p>
                </div>

                <form action={(formData) => updatePoll(id, formData)} className={styles.form}>
                    <input type="hidden" name="electionType" value={poll.electionType || 'nagar-palika'} />
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><Briefcase size={20} /> सामान्य माहिती ({poll.electionType === 'zp' ? 'ZP' : 'नगरपालिका'})</h2>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}><Type size={16} /> मुख्य शीर्षक</label>
                                <input name="title" defaultValue={poll.title} className={styles.input} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Type size={16} /> उप-शीर्षक {poll.electionType === 'zp' ? '(गट/गण)' : '(प्रभाग)'}</label>
                                <input name="subTitle" defaultValue={poll.subTitle} className={styles.input} required />
                            </div>



                            <div className={styles.formGroup}>
                                <label className={styles.label}><Briefcase size={16} /> पक्षाचे नाव</label>
                                <input name="partyName" defaultValue={poll.partyName} className={styles.input} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Calendar size={16} /> मतदानाची तारीख</label>
                                <input
                                    type="date"
                                    name="votingDate"
                                    className={styles.input}
                                    defaultValue={extractDate(poll.votingDate)}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Briefcase size={16} /> संपर्क नंबर (Optional)</label>
                                <input name="contactNumber" defaultValue={poll.contactNumber || ''} className={styles.input} placeholder="उदा. 91758xxxxx" />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><ImageIcon size={16} /> पक्षाचे चिन्ह (अद्ययावत करण्यासाठी नवीन फाइल निवडा)</label>
                            <input
                                type="file"
                                name="mainSymbolFile"
                                className={styles.input}
                                accept="image/*"
                                onChange={handleSymbolChange}
                            />
                            {symbolPreview && (
                                <div className={styles.previewContainer}>
                                    <img src={symbolPreview} alt="Preview" className={styles.previewImage} />
                                </div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><ImageIcon size={16} /> उमेदवारांचे फोटो दाखवायचे?</label>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                                    <input type="radio" name="showCandidateImages" value="true" defaultChecked={poll.showCandidateImages === true} /> हो (Yes)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                                    <input type="radio" name="showCandidateImages" value="false" defaultChecked={poll.showCandidateImages === false} /> नाही (No)
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>माहिती मजकूर (Info Texts)</h2>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>निळा बॉक्स मजकूर</label>
                                <input
                                    name="blueInfoText"
                                    defaultValue={poll.blueInfoText}
                                    className={styles.input}
                                    placeholder={`डेमो मतदानासाठी ${poll.partyName} निशाणी समोरील निळे बटण दाबावे`}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>पिवळा बॉक्स शीर्षक</label>
                                <input
                                    name="yellowTitleText"
                                    defaultValue={poll.yellowTitleText}
                                    className={styles.input}
                                    placeholder={`मतदानाच्या दिवशी सुद्धा "${poll.partyName}" पक्षाचे लोकप्रिय उमेदवार`}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>पिवळा बॉक्स तळटीप</label>
                                <input
                                    name="yellowFooterText"
                                    defaultValue={poll.yellowFooterText}
                                    className={styles.input}
                                    placeholder="यांना त्यांच्या नाव व चिन्हासमोरील बटन दाबून प्रचंड मताने विजयी करा!"
                                />
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}><Type size={20} /> उमेदवार यादी</h2>
                            <button type="button" onClick={addCandidate} className={styles.addButton}>
                                <Plus size={16} /> उमेदवार जोडा
                            </button>
                        </div>

                        <div className={styles.candidateList}>
                            {candidates.map((c, i) => (
                                <div key={i} className={styles.candidateRow}>
                                    <input type="hidden" name={`candidateExistingSymbol_${i}`} value={c.existingSymbolUrl || ''} />
                                    <div className={styles.rowField} style={{ flex: 1 }}>
                                        <label className={styles.label}>अ. क्र.</label>
                                        <input
                                            name={`candidateSr_${i}`}
                                            className={styles.input}
                                            defaultValue={c.sr}
                                            required
                                        />
                                    </div>
                                    <div className={styles.rowField} style={{ flex: 3 }}>
                                        <label className={styles.label}>उमेदवाराचे नाव</label>
                                        <input
                                            name={`candidateName_${i}`}
                                            className={styles.input}
                                            defaultValue={c.name}
                                            required
                                        />
                                    </div>
                                    <div className={styles.rowField} style={{ flex: 1.5 }}>
                                        <label className={styles.label}>{poll.electionType === 'zp' ? 'पद निवडा' : 'जागा'}</label>
                                        {poll.electionType === 'zp' ? (
                                            <select
                                                name={`candidateSeat_${i}`}
                                                className={styles.input}
                                                defaultValue={c.seat}
                                                required
                                            >
                                                <option value="">निवडा</option>
                                                <option value="जि.प. सदस्य">जि.प. सदस्य</option>
                                                <option value="पं.स. सदस्य">पं.स. सदस्य</option>
                                            </select>
                                        ) : (
                                            <input
                                                name={`candidateSeat_${i}`}
                                                className={styles.input}
                                                defaultValue={c.seat}
                                                placeholder="उदा. अ, ब, क"
                                            />
                                        )}
                                    </div>
                                    <div className={styles.rowField} style={{ flex: 2 }}>
                                        <label className={styles.label}>टेबल हेडर (Optional)</label>
                                        <input
                                            name={`candidateHeaderMsg_${i}`}
                                            className={styles.input}
                                            defaultValue={c.headerMessage || ''}
                                            placeholder="Custom Message"
                                        />
                                    </div>
                                    <div className={styles.rowField} style={{ flex: 2 }}>
                                        <label className={styles.label}><ImageIcon size={16} /> फोटो</label>
                                        <input
                                            type="file"
                                            name={`candidateImage_${i}`}
                                            className={styles.input}
                                            accept="image/*"
                                            onChange={(e) => handleCandidateImageChange(i, e)}
                                        />
                                        {c.imagePreview && (
                                            <div className={styles.previewContainer} style={{ width: '40px', height: '40px', marginTop: '5px' }}>
                                                <img src={c.imagePreview} alt="Preview" className={styles.previewImage} />
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.rowField} style={{ flex: 2 }}>
                                        <label className={styles.label}><ImageIcon size={16} /> पक्ष चिन्ह</label>
                                        <input type="hidden" name={`candidateExistingPartySymbol_${i}`} value={c.existingPartySymbolUrl || ''} />
                                        <input
                                            type="file"
                                            name={`candidatePartySymbol_${i}`}
                                            className={styles.input}
                                            accept="image/*"
                                            onChange={(e) => handleCandidatePartySymbolChange(i, e)}
                                        />
                                        {c.partySymbolPreview && (
                                            <div className={styles.previewContainer} style={{ width: '40px', height: '40px', marginTop: '5px' }}>
                                                <img src={c.partySymbolPreview} alt="Preview" className={styles.previewImage} />
                                            </div>
                                        )}
                                    </div>
                                    {candidates.length > 1 && (
                                        <button type="button" onClick={() => removeCandidate(i)} className={styles.removeButton}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    <button type="submit" className={styles.submitButton}>
                        माहिती अद्ययावत करा <Vote size={20} style={{ marginLeft: '10px' }} />
                    </button>
                </form>
            </div>
        </main>
    );
}
