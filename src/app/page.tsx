'use client';

import React, { useState, useEffect } from 'react';
import { createPoll } from './actions';
import styles from './page.module.css';
import { Plus, Trash2, Vote, Calendar, Image as ImageIcon, Briefcase, Type } from 'lucide-react';

interface CandidateRow {
    name: string;
    seat: string;
    sr: string;
    imagePreview: string | null;
    partySymbolPreview: string | null;
}

export default function CreatePollPage() {
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // You can change this password to whatever you like
        if (password === 'mm1344') {
            setIsAuthorized(true);
            setError('');
            sessionStorage.setItem('admin_auth', 'true');
        } else {
            setError('चुकीचा पासवर्ड! कृपया पुन्हा प्रयत्न करा.');
        }
    };

    const [candidates, setCandidates] = useState<CandidateRow[]>([
        { name: '', seat: 'अ', sr: '1', imagePreview: null, partySymbolPreview: null }
    ]);
    const [symbolPreview, setSymbolPreview] = useState<string | null>(null);

    const addCandidate = () => {
        setCandidates([...candidates, { name: '', seat: '', sr: (candidates.length + 1).toString(), imagePreview: null, partySymbolPreview: null }]);
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

    const [today, setToday] = useState('');

    useEffect(() => {
        setToday(new Date().toISOString().split('T')[0]);
        if (sessionStorage.getItem('admin_auth') === 'true') {
            setIsAuthorized(true);
        }
    }, []);

    if (!isAuthorized) {
        return (
            <main className={styles.main}>
                <div className={styles.container} style={{ maxWidth: '400px', marginTop: '40px' }}>
                    <div className={styles.header}>
                        <Vote className={styles.headerIcon} />
                        <h1 className={styles.title}>प्रवेश प्रतिबंधित</h1>
                        <p className={styles.subtitle}>पोल तयार करण्यासाठी पासवर्ड टाका</p>
                    </div>
                    <form onSubmit={handleLogin} className={styles.form}>
                        <div className={styles.formGroup}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                placeholder="पासवर्ड टाका"
                                required
                            />
                        </div>
                        {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
                        <button type="submit" className={styles.submitButton}>
                            Login
                        </button>
                    </form>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <Vote className={styles.headerIcon} />
                    <h1 className={styles.title}>डेमो मतदान यंत्र तयार करा</h1>
                    <p className={styles.subtitle}>निवडणूक तपशील भरा आणि नवीन पोल तयार करा</p>
                </div>

                <form action={createPoll} className={styles.form}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}><Briefcase size={20} /> सामान्य माहिती</h2>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}><Type size={16} /> मुख्य शीर्षक</label>
                                <input name="title" className={styles.input} placeholder="उदा. महानगरपालिका निवडणूक २०२६" required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Type size={16} /> उप-शीर्षक (प्रभाग)</label>
                                <input name="subTitle" className={styles.input} placeholder="उदा. प्रभाग क्रमांक २०" required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Briefcase size={16} /> पक्षाचे नाव</label>
                                <input name="partyName" className={styles.input} placeholder="उदा. शिवसेना" required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Calendar size={16} /> मतदानाची तारीख</label>
                                <input
                                    type="date"
                                    name="votingDate"
                                    className={styles.input}
                                    min={today}
                                    defaultValue={today}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Briefcase size={16} /> संपर्क नंबर (Optional)</label>
                                <input name="contactNumber" className={styles.input} placeholder="उदा. 91758xxxxx" />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><ImageIcon size={16} /> पक्षाचे चिन्ह (Image Upload)</label>
                            <input
                                type="file"
                                name="mainSymbolFile"
                                className={styles.input}
                                accept="image/*"
                                onChange={handleSymbolChange}
                                required
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
                                    <input type="radio" name="showCandidateImages" value="true" defaultChecked /> हो (Yes)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                                    <input type="radio" name="showCandidateImages" value="false" /> नाही (No)
                                </label>
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
                                    <div className={styles.rowField} style={{ flex: 1 }}>
                                        <label className={styles.label}>अ. क्र. (Sr. No.)</label>
                                        <input
                                            name={`candidateSr_${i}`}
                                            className={styles.input}
                                            value={c.sr}
                                            onChange={(e) => updateCandidate(i, 'sr', e.target.value)}
                                            placeholder="2"
                                            required
                                        />
                                    </div>
                                    <div className={styles.rowField} style={{ flex: 3 }}>
                                        <label className={styles.label}>उमेदवाराचे नाव</label>
                                        <input
                                            name={`candidateName_${i}`}
                                            className={styles.input}
                                            value={c.name}
                                            onChange={(e) => updateCandidate(i, 'name', e.target.value)}
                                            placeholder="नाव लिहा"
                                            required
                                        />
                                    </div>
                                    <div className={styles.rowField} style={{ flex: 1 }}>
                                        <label className={styles.label}>जागा</label>
                                        <input
                                            name={`candidateSeat_${i}`}
                                            className={styles.input}
                                            value={c.seat}
                                            onChange={(e) => updateCandidate(i, 'seat', e.target.value)}
                                            placeholder="उदा. अ, ब, क"
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
                        पोल तयार करा <Vote size={20} style={{ marginLeft: '10px' }} />
                    </button>
                </form>

                {/* <footer className={styles.footer} style={{ border: 'none' }}>
                    <div style={{ marginTop: '20px' }}>
                        <a href="/admin" style={{ fontSize: '0.9rem', color: '#666', textDecoration: 'none', opacity: 0.7 }}>
                            Admin Dashboard
                        </a>
                    </div>
                </footer> */}
            </div>
        </main>
    );
}
