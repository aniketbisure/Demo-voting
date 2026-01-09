import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';

const redisClientSingleton = () => {
    return createClient({
        url: process.env.REDIS_URL || process.env.KV_URL
    });
};

declare global {
    var redis: undefined | ReturnType<typeof redisClientSingleton>;
}

const redis = globalThis.redis ?? redisClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.redis = redis;

// Mock interface for local storage if Redis is down
const localDBPath = path.join(process.cwd(), 'src/data/polls.json');

const localMock = {
    isOpen: true,
    async connect() { return; },
    async set(key: string, value: string) {
        const id = key.replace('poll:', '');
        const data = JSON.parse(value);
        let polls = [];
        try {
            if (fs.existsSync(localDBPath)) {
                polls = JSON.parse(fs.readFileSync(localDBPath, 'utf8'));
            }
        } catch (e) { }

        const index = polls.findIndex((p: any) => p.id === id);
        if (index > -1) {
            polls[index] = data;
        } else {
            polls.push(data);
        }

        if (!fs.existsSync(path.dirname(localDBPath))) {
            fs.mkdirSync(path.dirname(localDBPath), { recursive: true });
        }
        fs.writeFileSync(localDBPath, JSON.stringify(polls, null, 2));
    },
    async get(key: string) {
        const id = key.replace('poll:', '');
        try {
            if (fs.existsSync(localDBPath)) {
                const polls = JSON.parse(fs.readFileSync(localDBPath, 'utf8'));
                const poll = polls.find((p: any) => p.id === id);
                return poll ? JSON.stringify(poll) : null;
            }
        } catch (e) { }
        return null;
    },
    async del(key: string) {
        const id = key.replace('poll:', '');
        try {
            if (fs.existsSync(localDBPath)) {
                const polls = JSON.parse(fs.readFileSync(localDBPath, 'utf8'));
                const filtered = polls.filter((p: any) => p.id !== id);
                fs.writeFileSync(localDBPath, JSON.stringify(filtered, null, 2));
            }
        } catch (e) { }
    },
    async keys(pattern: string) {
        try {
            if (fs.existsSync(localDBPath)) {
                const polls = JSON.parse(fs.readFileSync(localDBPath, 'utf8'));
                return polls.map((p: any) => `poll:${p.id}`);
            }
        } catch (e) { }
        return [];
    }
};

let useLocal = false;

export async function getRedisClient() {
    if (useLocal) return localMock;

    try {
        if (!redis.isOpen) {
            // Set a timeout for connection attempt
            const connectPromise = redis.connect();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Redis Timeout')), 2000)
            );
            await Promise.race([connectPromise, timeoutPromise]);
        }
        return redis;
    } catch (err) {
        console.warn("Redis connection failed, switching to local JSON storage:", err);
        useLocal = true;
        return localMock;
    }
}

export default redis;
