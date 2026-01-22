import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { getRedis, isRedisAvailable } from "@repo/redis";
import * as tf from "@tensorflow/tfjs-node";
import { predictScore } from "./logic";

const fastify = Fastify({
  logger: {
    mixin: () => ({ service: "reco-service" }),
  },
});

// Metrics
const startTime = Date.now();
let requestCount = 0;

fastify.addHook("onRequest", async (request) => {
  requestCount++;
  if (request.headers["x-trace-id"]) {
    request.id = request.headers["x-trace-id"] as string;
  }
});

fastify.addHook("onResponse", async (request, reply) => {
  request.log.info(
    {
      traceId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs: reply.getResponseTime(),
    },
    "request completed",
  );
});
const PORT = parseInt(process.env.PORT || "4003");

fastify.register(cors, { origin: true });

// Auth Middleware
fastify.addHook("preHandler", async (request, reply) => {
  const allowedPaths = ["/health", "/metrics", "/ready"];
  if (allowedPaths.some((p) => request.routerPath?.startsWith(p))) return;

  const key = request.headers["x-service-key"];
  if (key !== (process.env.SERVICE_KEY || "dev-service-key")) {
    reply.code(401).send({ error: "Unauthorized Service Call" });
  }
});

const recommendationsCache = new Map<
  string,
  { timestamp: number; data: any }
>();
const CACHE_TTL_MS = 30000;

// Simple TF Model (Functional way to ensure deterministic weights)
// We will simulate a trained model by using fixed weights.
// Features: [categoryMatch (0/1), trendingScore (0-1), userAffinity (0/1), priceBucket (0-1)]
// Logic extracted to logic.ts

fastify.get("/health", async () => {
  return { ok: true, service: "reco-service", time: new Date().toISOString() };
});

fastify.get("/ready", async () => {
  let dbStatus = "down";
  let redisStatus = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "up";
  } catch (e) {
    fastify.log.error(e);
  }

  if (isRedisAvailable()) {
    try {
      await getRedis().ping();
      redisStatus = "up";
    } catch (e) {
      fastify.log.error(e);
    }
  } else {
    redisStatus = "not_used";
  }

  return {
    ok:
      dbStatus === "up" && (redisStatus === "up" || redisStatus === "not_used"),
    service: "reco-service",
    dependencies: {
      db: dbStatus,
      redis: redisStatus,
    },
  };
});

fastify.get("/metrics", async () => {
  return {
    service: "reco-service",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    requestsTotal: requestCount,
  };
});

// Config Fetching
import { RecoWeights, DEFAULT_WEIGHTS } from "./config";

let cachedWeights: RecoWeights = DEFAULT_WEIGHTS;
let lastWeightCache = 0;
const WEIGHT_CACHE_TTL = 60000;
const CONFIG_URL = process.env.CONFIG_URL || "http://localhost:4006";

async function getWeights(): Promise<RecoWeights> {
  if (Date.now() - lastWeightCache < WEIGHT_CACHE_TTL) return cachedWeights;

  try {
    const response = await fetch(`${CONFIG_URL}/configs/reco.weights`, {
      headers: {
        "x-service-key": process.env.SERVICE_KEY || "dev-service-key",
      },
    });
    if (response.ok) {
      const data = (await response.json()) as any;
      if (data && data.valueJson) {
        cachedWeights = { ...DEFAULT_WEIGHTS, ...data.valueJson };
        lastWeightCache = Date.now();
      }
    }
  } catch (e) {
    console.error("Config fetch failed", e);
  }
  return cachedWeights;
}

fastify.get("/recommendations/:productId", async (request, reply) => {
  const { productId } = request.params as { productId: string };
  const { userId } = request.query as { userId?: string };
  const cacheKey = `mercury:reco:v1:product:${productId}:user:${userId || "anon"}`;
  const redis = getRedis();

  // 1. Try Redis
  if (isRedisAvailable()) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        reply.header("x-cache", "HIT");
        await redis.hincrby("mercury:cache:stats", "reco_hits", 1);
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 2. Fallback Memory
  if (!isRedisAvailable()) {
    const cached = recommendationsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  reply.header("x-cache", "MISS");
  if (isRedisAvailable())
    redis.hincrby("mercury:cache:stats", "reco_misses", 1).catch(() => {});

  // 3. Logic
  const currentProduct = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!currentProduct) {
    reply.code(404);
    return { error: "Product not found" };
  }

  const [candidates, recentEvents, userHistory] = await Promise.all([
    prisma.product.findMany({ where: { id: { not: productId } } }),
    prisma.event.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    userId
      ? prisma.event.findMany({
          where: {
            userId,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        })
      : Promise.resolve([]),
  ]);

  const weights = await getWeights();

  const scored = candidates.map((p) => {
    // Calculate Features
    const categoryMatch = p.category === currentProduct.category ? 1 : 0;

    // Check trending score
    const productEvents = recentEvents.filter((e) => e.productId === p.id);
    let trendingVal = 0;
    productEvents.forEach((e) => {
      if (e.type === "VIEW") trendingVal += weights.trendingWeights.VIEW;
      if (e.type === "CLICK") trendingVal += weights.trendingWeights.CLICK;
      if (e.type === "CART") trendingVal += weights.trendingWeights.CART;
      if (e.type === "PURCHASE")
        trendingVal += weights.trendingWeights.PURCHASE;
    });
    const trendingScore = Math.min(trendingVal, 10) / 10; // Normalize 0-1

    // User affinity
    const userAffinity = userHistory.some((e) => e.productId === p.id) ? 1 : 0;

    // Price bucket (Normalized around base price)
    const priceBucket = Math.min(p.price / (currentProduct.price || 1), 2) / 2;

    const features = [categoryMatch, trendingScore, userAffinity, priceBucket];

    // Run Inference
    const tfScore = predictScore(features);

    // Construct reasons directly from factors
    const reasons: string[] = [];
    if (categoryMatch) reasons.push("Similar Category");
    if (trendingScore > 0.3) reasons.push("Trending");
    if (userAffinity) reasons.push("Based on History");
    if (tfScore > 75) reasons.push("High Match Score");

    return {
      ...p,
      score: tfScore,
      reasons,
      scoreBreakdown: { tfScore, trendingScore, categoryMatch },
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topRecommendations = scored.slice(0, 6).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    currency: p.currency,
    category: p.category,
    imageUrl: p.imageUrl,
    score: parseFloat(p.score.toFixed(2)),
    reason: p.reasons.join(", ") || "Popular",
  }));

  const result = { productId, recommendations: topRecommendations };

  if (isRedisAvailable()) {
    redis.setex(cacheKey, 60, JSON.stringify(result)).catch(() => {});
  } else {
    recommendationsCache.set(cacheKey, { timestamp: Date.now(), data: result });
  }

  return result;
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Reco Service running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
