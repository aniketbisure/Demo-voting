import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poll from '@/models/Poll';
import { getRedisClient } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();

        let imageBase64: string | null = null;

        // 1. Try MongoDB
        const poll = await Poll.findOne({ id }).lean();
        if (poll && (poll.ogImage || poll.mainSymbolUrl)) {
            imageBase64 = poll.ogImage || poll.mainSymbolUrl;
        }

        // 2. Fallback to Legacy Redis
        if (!imageBase64) {
            const redis = await getRedisClient();
            const data = await redis.get(`poll:${id}`);
            if (data) {
                const legacyPoll = JSON.parse(data);
                imageBase64 = legacyPoll.ogImage || legacyPoll.mainSymbolUrl;
            }
        }

        if (!imageBase64 || !imageBase64.startsWith('data:image')) {
            return new NextResponse('Image not found', { status: 404 });
        }

        // Parse Data URI safely
        // Format: data:image/png;base64,iVBORw0KGgo...
        const parts = imageBase64.split(';base64,');

        if (parts.length !== 2) {
            console.error("Invalid base64 format for poll:", id);
            return new NextResponse('Invalid image data', { status: 500 });
        }

        const mimeType = parts[0].split(':')[1];
        const base64Data = parts[1];
        const buffer = Buffer.from(base64Data, 'base64');

        console.log(`Serving OG Image for ${id}: Type=${mimeType}, Size=${buffer.length} bytes`);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Content-Length': buffer.length.toString(),
                'Content-Disposition': `inline; filename="poll-image-${id}.${mimeType.split('/')[1]}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error) {
        console.error("Error serving OG image:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
