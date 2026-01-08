import React from 'react';
import { notFound } from 'next/navigation';
import { getRedisClient } from '@/lib/redis';
import DemoClient from './DemoClient';

// Force dynamic so it reads from Redis on every request
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

// Metadata for OG tags
export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const redis = await getRedisClient();
    const data = await redis.get(`poll:${id}`);
    const poll = data ? JSON.parse(data) : null;

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
    const redis = await getRedisClient();
    const data = await redis.get(`poll:${id}`);
    const poll = data ? JSON.parse(data) : null;

    if (!poll) {
        return notFound();
    }

    return <DemoClient poll={poll} />;
}
