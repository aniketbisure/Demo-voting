'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

interface Candidate {
    seat: string;
    name: string;
    symbolUrl: string;
    serialNumber?: string;
    bgColor?: string;
    partySymbolUrl?: string;
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
    contactNumber?: string;
    candidates: Candidate[];
}

export default function DemoClient({ poll }: { poll: Poll }) {
    // State now tracks which serial number was voted for in each unit (group) index
    // Key: groupIndex, Value: serialNumber of the voted candidate
    const [votes, setVotes] = useState<Record<number, string>>({});
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

    // Group candidates by Seat
    // We use a Map to preserve insertion order of the groups
    const groupedCandidates = React.useMemo(() => {
        const groups = new Map<string, Candidate[]>();
        poll.candidates.forEach(c => {
            // Normalise seat key (trim whitespace, handle case if needed, though exact match is safer)
            const key = c.seat ? c.seat.trim() : 'General';
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)?.push(c);
        });
        return Array.from(groups.values());
    }, [poll.candidates]);

    const cardRowColors = ['#ffffff', '#ffb6c1', '#ffffe0', '#add8e6'];

    const handleVote = (groupIndex: number, candidateSr: string) => {
        // If already voted for this group, do nothing
        if (votes[groupIndex]) return;

        // Record vote
        const newVotes = { ...votes, [groupIndex]: candidateSr };
        setVotes(newVotes);

        // Check if all groups are voted
        const totalGroups = groupedCandidates.length;
        const votedCount = Object.keys(newVotes).length;

        if (votedCount === totalGroups) {
            setTimeout(() => {
                lastAudioRef.current?.play().catch(() => { });
                setShowThankYou(true);
            }, 500);
        } else {
            setTimeout(() => {
                const nextUnit = groupIndex + 1;
                if (nextUnit < totalGroups && unitRefs.current[nextUnit]) {
                    unitRefs.current[nextUnit]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    setCurrentUnit(nextUnit);
                }
            }, 500);
        }
    };

    const defaultBlueText = `डेमो मतदानासाठी ${poll.partyName} निशाणी समोरील निळे बटण दाबावे`;
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

                {/* EVM Cards (One per Group/Seat) */}
                {groupedCandidates.map((group, groupIndex) => {
                    const rowColor = cardRowColors[groupIndex % cardRowColors.length];
                    const votedSr = votes[groupIndex]; // The SrNo voted for in this group (if any)
                    const isGroupVoted = !!votedSr;

                    // Calculate max serial number in this group to determine rows
                    let maxSr = 0;
                    group.forEach(c => {
                        const s = parseInt(c.serialNumber || '0');
                        if (s > maxSr) maxSr = s;
                    });
                    // Ensure at least 3 rows, or maxSr + 1 (to show some empty below if needed, or just maxSr)
                    // Standard EVM is usually 16 buttons. But for demo, let's keep it tight.
                    // Previous logic was max(3, candSr + 1).
                    // Let's use max(3, maxSr + 1) to be safe and consistent.
                    const totalRows = Math.max(3, maxSr + 1);
                    const rows = Array.from({ length: totalRows }, (_, idx) => idx + 1);

                    return (
                        <div
                            key={groupIndex}
                            className={styles.evmContainer}
                            ref={(el) => { unitRefs.current[groupIndex] = el; }}
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
                                        // Find candidate for this row number
                                        const candidate = group.find(c => parseInt(c.serialNumber || '0') === rowNum);
                                        const isCandidateRow = !!candidate;
                                        const isVotedRow = isGroupVoted && (candidate?.serialNumber === votedSr);

                                        // If group is voted, we might want to dim others? 
                                        // Current logic: "If voted, hide all rows except the main candidate row" -> Wait, previous code did this.
                                        // Previous: "if (isVoted && !isMainRow) return null;"
                                        // This collapses the table to ONLY show the voted candidate?
                                        // Let's keep that behavior if it's desired. User didn't complain.
                                        // "if we have have same जागा in form then same they in same box" - user wants them grouped.
                                        // If I vote for A, should B disappear?
                                        // Previous logic: YES. "If voted, hide all rows except the main candidate row".
                                        // We should probably maintain this behavior for visual consistency (it focuses on the selection).
                                        // BUT now we have multiple potential candidates.
                                        // If I vote for A, and B is in the same box... B disappears. Okay.

                                        if (isGroupVoted && !isVotedRow) return null;

                                        return (
                                            <tr
                                                key={rowNum}
                                                className={`${styles.row} ${isVotedRow ? styles.votedRow : ''}`}
                                                style={{ backgroundColor: rowColor }}
                                            >
                                                <td className={`${styles.cellSr} ${isCandidateRow ? styles.redBorder : ''} ${isVotedRow || (isCandidateRow && !isGroupVoted) ? styles.targetSr : ''}`}>
                                                    {rowNum}.
                                                </td>
                                                <td className={styles.cellName}>
                                                    {candidate ? candidate.name : ''}
                                                </td>
                                                {poll.showCandidateImages && (
                                                    <td className={styles.cellCandidate}>
                                                        {candidate && (
                                                            <img src={candidate.symbolUrl} alt={candidate.name} className={styles.candidateImg} />
                                                        )}
                                                    </td>
                                                )}
                                                <td className={styles.cellSymbol}>
                                                    {candidate && (
                                                        <>
                                                            <img src={candidate.partySymbolUrl || poll.mainSymbolUrl}
                                                                alt="Symbol"
                                                                className={styles.symbolImg} />
                                                            {isVotedRow && <div className={styles.redLamp}></div>}
                                                        </>
                                                    )}
                                                </td>
                                                <td className={styles.cellButton}>
                                                    <div className={styles.buttonArea}>
                                                        <svg className={`${styles.arrow} ${isVotedRow ? styles.votedArrow : ''}`} viewBox="0 0 100 50">
                                                            <path d="M5,15 L60,15 L60,5 L95,25 L60,45 L60,35 L5,35 Z"
                                                                fill={isVotedRow ? 'red' : 'none'}
                                                                stroke={isVotedRow ? 'red' : 'black'}
                                                                strokeWidth="2" />
                                                        </svg>
                                                        <button
                                                            className={styles.blueButton}
                                                            onClick={() => candidate && handleVote(groupIndex, candidate.serialNumber || rowNum.toString())}
                                                            disabled={isGroupVoted} // Disable all buttons in this group if voted
                                                            style={{ cursor: isGroupVoted ? 'default' : 'pointer' }}
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
                    <div className={styles.contactEmail}>अशा प्रकारची वेबसाइट तयार करण्यासाठी संपर्क साधा:<br />  <a href={`tel:${poll.contactNumber || '9657301344'}`} className={styles.bigContact}>{poll.contactNumber || '9657301344'}</a></div>
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
