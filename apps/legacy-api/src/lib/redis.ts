import Redis from "ioredis";

// Global flag to track Redis availability
export let redisAvailable = false;

let redis: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redis) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    redis = new Redis(url, {
      lazyConnect: true, // Don't connect immediately, wait for manual connection
      retryStrategy: (times) => {
        // Retry connection with backoff
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 1, // Don't hang indefinitely on requests
    });

    redis.on("connect", () => {
      console.log("Redis connected");
      redisAvailable = true;
    });

    redis.on("error", (err) => {
      // Only log unique errors or status changes to avoid noise
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

    // Attempt initial connection without blocking
    redis.connect().catch((err) => {
      // Initial connection fail is handled by 'error' event usually,
      // but explicit catch here ensures no unhandled promise rejection.
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
