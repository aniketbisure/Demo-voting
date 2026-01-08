import React from 'react';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import DemoClient from './DemoClient';

// Force dynamic so it reads the file on every request
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

const getData = () => {
    try {
        const filePath = path.join(process.cwd(), 'src/data/polls.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
};

// Metadata for OG tags
export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const pollsData = getData();
    const poll = pollsData.find((p: any) => p.id === id);
    if (!poll) return {};

    return {
        title: `${poll.subTitle} - ${poll.partyName} - डेमो मतदान यंत्र`,
        description: poll.title,
        openGraph: {
            title: `${poll.subTitle} - ${poll.partyName} - डेमो मतदान यंत्र`,
            description: poll.title,
            images: [poll.ogImage || poll.mainSymbolUrl],
        },
    };
}

export default async function DemoPage({ params }: PageProps) {
    const { id } = await params;
    const pollsData = getData();
    const poll = pollsData.find((p: any) => p.id === id);

    if (!poll) {
        return notFound();
    }

    return <DemoClient poll={poll} />;
}
