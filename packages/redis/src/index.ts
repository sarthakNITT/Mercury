import Redis from "ioredis";

// Global flag to track Redis availability
export let redisAvailable = false;

let redis: Redis | null = null;

export const getRedis = (url?: string): Redis => {
  if (!redis) {
    const redisUrl = url || process.env.REDIS_URL || "redis://localhost:6379";
    redis = new Redis(redisUrl, {
      lazyConnect: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 1,
    });

    redis.on("connect", () => {
      console.log("Redis connected");
      redisAvailable = true;
    });

    redis.on("error", (err) => {
      if (redisAvailable) {
        console.error("Redis connection lost:", err.message);
      }
      redisAvailable = false;
    });

    redis.on("close", () => {
      if (redisAvailable) {
        console.warn("Redis connection closed");
      }
      redisAvailable = false;
    });

    redis.connect().catch(() => {
      console.warn(
        "Initial Redis connection failed, running in fallback mode.",
      );
    });
  }
  return redis;
};

export const isRedisAvailable = (): boolean => {
  return redisAvailable;
};
