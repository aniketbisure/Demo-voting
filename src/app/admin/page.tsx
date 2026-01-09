'use client';

import React, { useEffect, useState } from 'react';
import { getAllPolls, deletePoll, toggleCandidateImages } from '../actions';
import styles from './admin.module.css';
import { Eye, Edit2, Trash2, Lock, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState('');
    const [polls, setPolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'mastermind800800') {
            setIsAuthorized(true);
            setError('');
            sessionStorage.setItem('admin_auth', 'true');
        } else {
            setError('चुकीचा पासवर्ड!');
        }
    };

    useEffect(() => {
        if (sessionStorage.getItem('admin_auth') === 'true') {
            setIsAuthorized(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthorized) {
            fetchPolls();
        }
    }, [isAuthorized]);

    const fetchPolls = async () => {
        setLoading(true);
        try {
            const data = await getAllPolls();
            setPolls(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this poll?')) {
            await deletePoll(id);
            fetchPolls();
        }
    };

    const handleToggleImages = async (id: string, currentState: boolean) => {
        await toggleCandidateImages(id, currentState);
        fetchPolls();
    };

    if (!isAuthorized) {
        return (
            <main className={styles.main}>
                <div className={styles.container} style={{ maxWidth: '400px', marginTop: '40px' }}>
                    <div className={styles.header}>
                        <Lock size={48} color="#3182ce" style={{ marginBottom: '1rem' }} />
                        <h1 className={styles.title}>Admin Login</h1>
                        <p className={styles.subtitle}>Enter password to access dashboard</p>
                    </div>
                    <form onSubmit={handleLogin} className={styles.form}>
                        <div className={styles.formGroup}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                placeholder="Password"
                                required
                            />
                        </div>
                        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
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
                    <h1 className={styles.title}>
                        <LayoutDashboard size={32} /> Admin Dashboard
                    </h1>
                    <p className={styles.subtitle}>Manage all your voting links here</p>
                </div>

                <div className={styles.pollList}>
                    {loading ? (
                        <p className={styles.emptyState}>Loading polls...</p>
                    ) : polls.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No polls created yet.</p>
                            <Link href="/" className={styles.actionButton + ' ' + styles.viewBtn} style={{ display: 'inline-flex', marginTop: '1rem' }}>
                                Create New Poll
                            </Link>
                        </div>
                    ) : (
                        polls
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((poll) => (
                                <div key={poll.id} className={styles.pollCard}>
                                    <div className={styles.pollInfo}>
                                        <h3 className={styles.pollTitle}>{poll.title}</h3>
                                        <p className={styles.pollSub}>{poll.subTitle} | ID: {poll.id}</p>
                                        <div style={{ marginTop: '5px' }}>
                                            <button
                                                onClick={() => handleToggleImages(poll.id, !!poll.showCandidateImages)}
                                                style={{
                                                    fontSize: '11px',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    border: '1px solid #ccc',
                                                    background: poll.showCandidateImages ? '#e6fffa' : '#fff5f5',
                                                    color: poll.showCandidateImages ? '#285e61' : '#822727',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Photos: {poll.showCandidateImages ? 'ENABLED' : 'DISABLED'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.pollActions}>
                                        <Link href={`/demo/${poll.id}`} target="_blank" className={styles.actionButton + ' ' + styles.viewBtn}>
                                            <Eye size={16} /> View
                                        </Link>
                                        <Link href={`/admin/edit/${poll.id}`} className={styles.actionButton + ' ' + styles.editBtn}>
                                            <Edit2 size={16} /> Edit
                                        </Link>
                                        <button onClick={() => handleDelete(poll.id)} className={styles.actionButton + ' ' + styles.deleteBtn}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Pagination Controls */}
                {polls.length > itemsPerPage && (
                    <div className={styles.pagination}>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span className={styles.pageInfo}>
                            Page {currentPage} of {Math.ceil(polls.length / itemsPerPage)}
                        </span>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(polls.length / itemsPerPage), p + 1))}
                            disabled={currentPage === Math.ceil(polls.length / itemsPerPage)}
                        >
                            Next
                        </button>
                    </div>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link href="/" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: '500' }}>
                        + Create another poll
                    </Link>
                </div>
            </div>
        </main>
    );
}
