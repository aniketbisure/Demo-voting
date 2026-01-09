'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

interface Candidate {
    seat: string;
    name: string;
    symbolUrl: string;
    serialNumber?: string;
    bgColor?: string;
}


interface Poll {
    id: string;
    title: string;
    subTitle: string;
    partyName: string;
    mainSymbolUrl: string;
    ogImage: string;
    votingDate?: string;
    blueInfoText?: string;
    yellowTitleText?: string;
    yellowFooterText?: string;
    showCandidateImages?: boolean;
    candidates: Candidate[];
}

export default function DemoClient({ poll }: { poll: Poll }) {
    const [votedUnits, setVotedUnits] = useState<number[]>([]);
    const [showThankYou, setShowThankYou] = useState(false);
    const [currentUnit, setCurrentUnit] = useState(0);
    const [shareUrl, setShareUrl] = useState('');

    const lastAudioRef = useRef<HTMLAudioElement | null>(null);
    const unitRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        lastAudioRef.current = new Audio('/sounds/sound.mp3');
        if (typeof window !== 'undefined') {
            setShareUrl(window.location.href);
        }
    }, []);

    const cardRowColors = ['#ffffff', '#ffb6c1', '#ffffe0', '#add8e6'];

    const handleVote = (candidate: Candidate, unitIndex: number, isCorrect: boolean) => {
        if (isCorrect) {
            const alreadyVoted = votedUnits.includes(unitIndex);

            if (!alreadyVoted) {
                const newVoted = [...votedUnits, unitIndex];
                setVotedUnits(newVoted);

                if (newVoted.length === poll.candidates.length) {
                    setTimeout(() => {
                        lastAudioRef.current?.play().catch(() => { });
                        setShowThankYou(true);
                    }, 500);
                } else {
                    setTimeout(() => {
                        const nextUnit = unitIndex + 1;
                        if (nextUnit < poll.candidates.length && unitRefs.current[nextUnit]) {
                            unitRefs.current[nextUnit]?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                            });
                            setCurrentUnit(nextUnit);
                        }
                    }, 500);
                }
            } else {
                // If already voted for this unit, but all units are complete, show the thank you modal
                if (votedUnits.length === poll.candidates.length) {
                    setShowThankYou(true);
                }
            }
        }
    };

    const defaultBlueText = "डेमो मतदानासाठी खालील यादीतील निर्णय घेतला आहे कृपया दाबा";
    const defaultYellowTitle = `मतदानाच्या दिवशी सुद्धा "${poll.partyName}" पक्षाचे लोकप्रिय उमेदवार`;
    const defaultYellowFooter = "यांना त्यांच्या नाव व चिन्हासमोरील बटन दाबून प्रचंड मताने विजयी करा!";

    return (
        <main className={styles.mainWrapper}>
            <div className={styles.container}>

                {/* Header */}
                <div className={styles.headerGradient}>
                    <h1 className={styles.electionTitle}>{poll.title}</h1>
                </div>

                {/* Title Row */}
                <div className={styles.titleRow}>
                    <div className={styles.wardNumber}>{poll.subTitle}</div>
                    <div className={styles.demoTitle}>डमी मतदान यंत्र</div>
                    <a
                        href={`https://wa.me/?text=${encodeURIComponent(`${shareUrl}\n\nमी डेमो मतदान केले, तुम्ही केले का?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img src="/wp.png" alt="WhatsApp" className={styles.whatsappIcon} style={{ width: '120px', height: 'auto' }} />
                    </a>
                </div>

                {/* Blue Info Box */}
                <div className={styles.blueInfo}>
                    {poll.blueInfoText || defaultBlueText}
                </div>

                {/* Yellow Info Box */}
                <div className={styles.yellowInfo}>
                    <div className={styles.yellowTitle}>
                        {poll.yellowTitleText || `मतदानाच्या दिवशी सुद्धा "${poll.partyName}" पक्षाचे लोकप्रिय उमेदवार`}
                    </div>
                    <ul className={styles.candidateList}>
                        {poll.candidates.map((c, i) => (
                            <li key={i}>
                                <strong>जागा {c.seat}</strong> - {c.name}
                            </li>
                        ))}
                    </ul>
                    <div className={styles.yellowFooter}>
                        {poll.yellowFooterText || "यांना त्यांच्या नाव व चिन्हासमोरील बटन दाबून प्रचंड मताने विजयी करा!"}
                    </div>
                </div>


                {/* Date Box */}
                <div className={styles.dateBox}>
                    {poll.votingDate || "मतदान दि.- १५/०१/२०२६ रोजी स. ७ ते सायं. ६ पर्यंत"}
                </div>

                {/* EVM Cards */}
                {poll.candidates.map((candidate, cardIndex) => {
                    const rowColor = cardRowColors[cardIndex % cardRowColors.length];
                    const isVoted = votedUnits.includes(cardIndex);

                    // Convert serialNumber to integer or default to 2
                    const candSr = parseInt(candidate.serialNumber || '2');
                    // We render at least 3 rows, or up to the candidate's SR + 1
                    const totalRows = Math.max(3, candSr + 1);
                    const rows = Array.from({ length: totalRows }, (_, idx) => idx + 1);

                    return (
                        <div
                            key={cardIndex}
                            className={styles.evmContainer}
                            ref={(el) => { unitRefs.current[cardIndex] = el; }}
                        >
                            <table className={styles.candidateTable}>
                                <thead>
                                    <tr className={styles.tableHeader}>
                                        <th className={styles.headerCell}>अ. क्र.</th>
                                        <th className={styles.headerCell}>उमेदवार नाव</th>
                                        {poll.showCandidateImages && <th className={styles.headerCell}>फोटो</th>}
                                        <th className={styles.headerCell}>चिन्ह</th>
                                        <th className={styles.headerCell}>बटन</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((rowNum) => {
                                        const isMainRow = rowNum === candSr;

                                        // If voted, hide all rows except the main candidate row
                                        if (isVoted && !isMainRow) return null;

                                        return (
                                            <tr
                                                key={rowNum}
                                                className={`${styles.row} ${isVoted && isMainRow ? styles.votedRow : ''}`}
                                                style={{ backgroundColor: rowColor }}
                                            >
                                                <td className={`${styles.cellSr} ${isMainRow ? styles.redBorder : ''} ${isMainRow ? styles.targetSr : ''}`}>
                                                    {rowNum}.
                                                </td>
                                                <td className={styles.cellName}>
                                                    {isMainRow ? candidate.name : ''}
                                                </td>
                                                {poll.showCandidateImages && (
                                                    <td className={styles.cellCandidate}>
                                                        {isMainRow && (
                                                            <img src={candidate.symbolUrl} alt={candidate.name} className={styles.candidateImg} />
                                                        )}
                                                    </td>
                                                )}
                                                <td className={styles.cellSymbol}>
                                                    {isMainRow && (
                                                        <>
                                                            <img src={poll.mainSymbolUrl}
                                                                alt="Symbol"
                                                                className={styles.symbolImg} />
                                                            {isVoted && <div className={styles.redLamp}></div>}
                                                        </>
                                                    )}
                                                </td>
                                                <td className={styles.cellButton}>
                                                    <div className={styles.buttonArea}>
                                                        <svg className={`${styles.arrow} ${isVoted ? styles.votedArrow : ''}`} viewBox="0 0 100 50">
                                                            <path d="M5,15 L60,15 L60,5 L95,25 L60,45 L60,35 L5,35 Z"
                                                                fill={isVoted ? 'red' : 'none'}
                                                                stroke={isVoted ? 'red' : 'black'}
                                                                strokeWidth="2" />
                                                        </svg>
                                                        <button
                                                            className={styles.blueButton}
                                                            onClick={() => handleVote(candidate, cardIndex, isMainRow)}
                                                        >
                                                            बटण दाबा
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}


                {/* Footer */}
                <footer className={styles.footer}>
                    <div>2025 © <a href="https://mmvoters.in">mmvoters.in</a></div>
                    <div className={styles.contactEmail}>To create this kind of website, contact:<br />  <a href="tel:9657301344" className={styles.bigContact}>9657301344</a></div>
                </footer>
            </div>

            {/* Thank You Modal */}
            {showThankYou && (
                <div className={styles.modalOverlay} onClick={() => setShowThankYou(false)}>
                    <div className={styles.thankYouModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeIcon} onClick={() => setShowThankYou(false)}>
                            ✕
                        </button>
                        <div className={styles.blueHeader}>
                            <h4 className={styles.thankYouTitle}>धन्यवाद!</h4>
                        </div>
                        <div className={styles.whiteBody}>
                            {poll.showCandidateImages ? (
                                <div className={styles.modalCandidateGrid}>
                                    {poll.candidates.map((c, i) => (
                                        <div key={i} className={styles.modalCandidateBox}>
                                            <div className={styles.modalImageContainer}>
                                                <img src={c.symbolUrl} alt={c.name} />
                                            </div>
                                            <div className={styles.modalSeatLabel}>जागा {c.seat}</div>
                                            <div className={styles.modalCandidateName}>{c.name}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.modalBigSymbolContainer}>
                                    <img src={poll.mainSymbolUrl} alt="Party Symbol" className={styles.modalBigSymbol} />
                                </div>
                            )}
                            <p className={styles.message}>तुमचे डेमो मतदान यशस्वीरित्या पूर्ण झाले आहे!</p>
                            <button className={styles.closeBtn} onClick={() => setShowThankYou(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
