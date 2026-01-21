import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { getRedis, isRedisAvailable } from "@repo/redis";

const fastify = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "4003");

fastify.register(cors, { origin: true });

const recommendationsCache = new Map<
  string,
  { timestamp: number; data: any }
>();
const CACHE_TTL_MS = 30000;

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
    let score = 0;
    const reasons: string[] = [];
    if (p.category === currentProduct.category) {
      score += 30;
      reasons.push("Same category");
    }
    const productEvents = recentEvents.filter((e) => e.productId === p.id);
    let trendingScore = 0;
    productEvents.forEach((e) => {
      if (e.type === "VIEW") trendingScore += 0.2;
      if (e.type === "CLICK") trendingScore += 0.6;
      if (e.type === "CART") trendingScore += 1.2;
      if (e.type === "PURCHASE") trendingScore += 2.0;
    });
    if (trendingScore > 0) {
      score += trendingScore;
      reasons.push("Trending now");
    }
    if (
      userHistory.some(
        (e) =>
          e.productId === p.id && (e.type === "CLICK" || e.type === "CART"),
      )
    ) {
      score += 10;
      reasons.push("Based on your interest");
    }
    // TF Placeholder logic
    // if (useTensorFlow) { score += tfModel.predict(p, user); }

    return { ...p, score, reasons };
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
