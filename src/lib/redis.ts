import { createClient } from 'redis';

const redisClientSingleton = () => {
    return createClient({
        url: process.env.REDIS_URL || process.env.KV_URL
    });
};

declare global {
    var redis: undefined | ReturnType<typeof redisClientSingleton>;
}

const redis = globalThis.redis ?? redisClientSingleton();

export default redis;

if (process.env.NODE_ENV !== 'production') globalThis.redis = redis;

export async function getRedisClient() {
    if (!redis.isOpen) {
        await redis.connect();
    }
    return redis;
}
