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
