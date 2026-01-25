import Redis from "ioredis";

// Reuse existing connection if possible
let redisClient: Redis | null = null;
let isAvailable = false;

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const getRedis = (): Redis => {
  if (redisClient) return redisClient;

  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1, // Fail fast for demo
    retryStrategy(times) {
      if (times > 3) {
        console.warn("Redis retry limit reached. Redis is likely down.");
        isAvailable = false;
        return null;
      }
      return Math.min(times * 50, 2000);
    },
    lazyConnect: true, // Don't crash on startup if unavailable
  });

  redisClient.on("connect", () => {
    isAvailable = true;
    console.log("Redis connected");
  });

  redisClient.on("error", (err) => {
    isAvailable = false;
    // Suppress unhandled error crash
    // console.error("Redis error", err.message);
  });

  // Try connecting
  redisClient.connect().catch(() => {
    // Ignore initial connect error, retry strategy handles it
  });

  return redisClient;
};

export const isRedisAvailable = () => isAvailable;

// --- Caching Helpers ---

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable()) return null;
  try {
    const data = await getRedis().get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// Standardized Cache Key Generator
// Format: mercury:cache:<service>:<resource>:<scope>:<hash>
export function generateCacheKey(
  service: string,
  resource: string,
  scope: string,
  identifier: string | object,
): string {
  const hash =
    typeof identifier === "string"
      ? identifier
      : JSON.stringify(identifier).replace(/[\"\:]/g, ""); // Simple hash for demo
  return `mercury:cache:${service}:${resource}:${scope}:${hash}`;
}

export async function cacheSetJson(
  key: string,
  value: any,
  ttlSeconds: number,
): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    await getRedis().del(key);
  } catch (e) {
    // ignore
  }
}

export async function cacheScanDel(prefix: string): Promise<void> {
  if (!isRedisAvailable()) return;
  const redis = getRedis();
  const stream = redis.scanStream({ match: `${prefix}*`, count: 100 });

  stream.on("data", (keys: string[]) => {
    if (keys.length) {
      const pipeline = redis.pipeline();
      keys.forEach((key) => pipeline.del(key));
      pipeline.exec().catch(() => {});
    }
  });

  return new Promise((resolve) => {
    stream.on("end", resolve);
    stream.on("error", resolve); // Don't crash
  });
}
