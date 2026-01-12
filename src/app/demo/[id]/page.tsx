import React from 'react';
import { notFound } from 'next/navigation';
import { getPoll } from '../../actions';
import DemoClient from './DemoClient';

// Force dynamic so it reads from DB on every request
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

// Metadata for OG tags
export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const poll = await getPoll(id);

    if (!poll) return {};

    return {
        title: `${poll.subTitle} - ${poll.partyName} - डेमो मतदान यंत्र`,
        description: poll.title,
        openGraph: {
            title: `${poll.subTitle} - ${poll.partyName} - डेमो मतदान यंत्र`,
            description: poll.title,
            images: [poll.ogImage || poll.mainSymbolUrl],
        },
        icons: {
            icon: poll.mainSymbolUrl,
            shortcut: poll.mainSymbolUrl,
            apple: poll.mainSymbolUrl,
        },
    };
}

export default async function DemoPage({ params }: PageProps) {
    const { id } = await params;
    const poll = await getPoll(id);

    if (!poll) {
        return notFound();
    }

    return <DemoClient poll={poll} />;
}

