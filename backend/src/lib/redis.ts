import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 0,
  retryStrategy: () => null,
  lazyConnect: true,
  tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
});

redis.on("error", (err) => {
  // Cache is a non-critical dependency: log but never crash the API because of it.
  console.warn("[redis] connection issue:", err.message);
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch (err) {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    // ignore cache write failures
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    // ignore
  }
}

export default redis;
