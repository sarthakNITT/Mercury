import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { getRedis, isRedisAvailable } from "@repo/redis";
import * as tf from "@tensorflow/tfjs-node";

const fastify = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "4003");

fastify.register(cors, { origin: true });

const recommendationsCache = new Map<
  string,
  { timestamp: number; data: any }
>();
const CACHE_TTL_MS = 30000;

// Simple TF Model (Functional way to ensure deterministic weights)
// We will simulate a trained model by using fixed weights.
// Features: [categoryMatch (0/1), trendingScore (0-1), userAffinity (0/1), priceBucket (0-1)]
const MODEL_WEIGHTS = tf.tensor1d([0.3, 0.5, 0.2, -0.1]); // weights
const MODEL_BIAS = tf.scalar(0.05);

function predictScore(features: number[]) {
  return tf.tidy(() => {
    const input = tf.tensor1d(features);
    // Dot product + bias
    const score = input.dot(MODEL_WEIGHTS).add(MODEL_BIAS);
    // Sigmoid to keep between 0-1, then scale up
    return score.sigmoid().mul(100).dataSync()[0] || 0;
  });
}

fastify.get("/health", async () => {
  return { service: "reco-service", status: "ok" };
});

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

  const scored = candidates.map((p) => {
    // Calculate Features
    const categoryMatch = p.category === currentProduct.category ? 1 : 0;

    // Check trending score
    const productEvents = recentEvents.filter((e) => e.productId === p.id);
    let trendingVal = 0;
    productEvents.forEach((e) => {
      if (e.type === "VIEW") trendingVal += 0.2;
      if (e.type === "CLICK") trendingVal += 0.6;
      if (e.type === "CART") trendingVal += 2.0;
      if (e.type === "PURCHASE") trendingVal += 5.0;
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
