import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poll from '@/models/Poll';
import { getRedisClient } from '@/lib/redis';

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

        // Parse Data URI
        // Format: data:image/png;base64,iVBORw0KGgo...
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
            return new NextResponse('Invalid image data', { status: 500 });
        }

        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error) {
        console.error("Error serving OG image:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
