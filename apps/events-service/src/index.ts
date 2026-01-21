import Fastify, { FastifyReply } from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { getRedis, isRedisAvailable } from "@repo/redis";
import { EventBodySchema } from "@repo/shared";

const fastify = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "4002");

fastify.register(cors, { origin: true });

// Auth Middleware
fastify.addHook("preHandler", async (request, reply) => {
  const allowedPaths = ["/health", "/metrics", "/demo"];
  if (allowedPaths.some((p) => request.routerPath?.startsWith(p))) return;

  const key = request.headers["x-service-key"];
  if (key !== (process.env.SERVICE_KEY || "dev-service-key")) {
    reply.code(401).send({ error: "Unauthorized Service Call" });
  }
});

const sseClients = new Set<any>();

const broadcast = (type: string, payload: any) => {
  const data = JSON.stringify({ type, payload });
  for (const client of sseClients) {
    client.write(`event: event\ndata: ${data}\n\n`);
  }
};

// Keep-alive heartbeat
setInterval(() => {
  for (const client of sseClients) {
    client.write(":\n\n");
  }
}, 15000);

fastify.get("/health", async () => {
  return { service: "events-service", status: "ok" };
});

// SSE Stream
fastify.get("/events/stream", (request, reply) => {
  const raw = reply.raw;
  raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  sseClients.add(raw);
  raw.write(`event: connected\ndata: "Connected to Events Stream"\n\n`);

  request.raw.on("close", () => {
    sseClients.delete(raw);
  });
});

// Create Event
fastify.post("/events", async (request, reply) => {
  const result = EventBodySchema.safeParse(request.body);
  if (!result.success) {
    reply.code(400);
    return { error: "Validation failed", details: result.error.issues };
  }

  const { userId, productId, type, meta } = result.data;

  // Create Event
  const event = await prisma.event.create({
    data: {
      userId,
      productId,
      type,
      meta: meta ? (meta as any) : undefined, // Postgres Json field
    },
  });

  // Redis Updates (Fire & Forget)
  if (isRedisAvailable()) {
    const redis = getRedis();
    const score =
      type === "VIEW"
        ? 1
        : type === "CLICK"
          ? 3
          : type === "CART"
            ? 6
            : type === "PURCHASE"
              ? 10
              : 0;

    if (score > 0) {
      redis
        .zincrby("mercury:trending:24h", score, productId)
        .catch(console.error);
      redis.expire("mercury:trending:24h", 86400);
    }

    const pipeline = redis.pipeline();
    pipeline.hincrby("mercury:metrics:counters", "total_events", 1);
    if (type === "VIEW")
      pipeline.hincrby("mercury:metrics:counters", "views", 1);
    if (type === "CLICK")
      pipeline.hincrby("mercury:metrics:counters", "clicks", 1);
    if (type === "CART")
      pipeline.hincrby("mercury:metrics:counters", "carts", 1);
    if (type === "PURCHASE") {
      pipeline.hincrby("mercury:metrics:counters", "purchases", 1);
      if (meta && (meta as any).decision === "BLOCK")
        pipeline.hincrby("mercury:metrics:counters", "blocked", 1);
      if (meta && (meta as any).decision === "CHALLENGE")
        pipeline.hincrby("mercury:metrics:counters", "challenged", 1);
      if (meta && (meta as any).decision === "ALLOW")
        pipeline.hincrby("mercury:metrics:counters", "allowed", 1);
    }
    pipeline.exec().catch(console.error);
  }

  // Broadcast
  broadcast("EVENT_CREATED", event);

  return event;
});

// Recent Events
fastify.get("/events/recent", async () => {
  const events = await prisma.event.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { user: true, product: true },
  });
  return events;
});

// Fraud Feed
fastify.get("/events/fraud", async () => {
  // Fetch purchases with meta
  // In strict production we should query meta->>'decision' != 'ALLOW' etc.
  // But Prisma raw query or filtering in-memory is safer for now.
  const events = await prisma.event.findMany({
    where: { type: "PURCHASE" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: true, product: true },
  });

  return events
    .filter((e) => {
      const m = e.meta as any;
      return m && m.decision && m.decision !== "ALLOW";
    })
    .slice(0, 15);
});

// Generate Events
fastify.post("/events/generate", async (request, reply) => {
  const { count = 50 } = (request.query as any) || {};
  const c = typeof count === "string" ? parseInt(count) : count;

  const users = await prisma.user.findMany({ select: { id: true } });
  const products = await prisma.product.findMany({ select: { id: true } });

  if (users.length === 0 || products.length === 0) {
    reply.code(400);
    return { error: "No users or products found" };
  }

  const types = [
    "VIEW",
    "VIEW",
    "VIEW",
    "CLICK",
    "CLICK",
    "CART",
    "PURCHASE",
  ] as const;
  const items = [];

  for (let i = 0; i < c; i++) {
    const u = users[Math.floor(Math.random() * users.length)];
    const p = products[Math.floor(Math.random() * products.length)];
    const t = types[Math.floor(Math.random() * types.length)] || "VIEW";
    if (u && p) {
      items.push({
        userId: u.id,
        productId: p.id,
        type: t,
        meta: { note: "Generated" } as any,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000)),
      });
    }
  }

  await prisma.event.createMany({ data: items });
  broadcast("BATCH_CREATED", { count: c });
  return { generated: c };
});

// Trending Endpoint
fastify.get("/trending", async (request, reply) => {
  const { limit = 10 } = request.query as { limit?: number };
  const redis = getRedis();

  if (isRedisAvailable()) {
    try {
      const range = await redis.zrevrange(
        "mercury:trending:24h",
        0,
        limit - 1,
        "WITHSCORES",
      );
      const items = [];
      for (let i = 0; i < range.length; i += 2) {
        if (range[i])
          items.push({ id: range[i]!, score: parseFloat(range[i + 1]!) });
      }

      if (items.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: items.map((x) => x.id) } },
        });
        const hydrated = items
          .map((item) => {
            const p = products.find((prod) => prod.id === item.id);
            return p ? { product: p, score: item.score } : null;
          })
          .filter(Boolean);
        return { limit, items: hydrated, source: "redis" };
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Fallback DB
  const recentEvents = await prisma.event.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { productId: true, type: true },
  });

  const scores: Record<string, number> = {};
  recentEvents.forEach((e) => {
    let s = 0;
    if (e.type === "VIEW") s = 1;
    else if (e.type === "CLICK") s = 3;
    else if (e.type === "CART") s = 6;
    else if (e.type === "PURCHASE") s = 10;
    scores[e.productId] = (scores[e.productId] || 0) + s;
  });

  const topIds = Object.keys(scores)
    .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
    .slice(0, limit);
  const products = await prisma.product.findMany({
    where: { id: { in: topIds } },
  });
  const items = topIds
    .map((id) => {
      const p = products.find((prod) => prod.id === id);
      return p ? { product: p, score: scores[id] } : null;
    })
    .filter(Boolean);

  return { limit, items, source: "db" };
});

// Metrics Overview
fastify.get("/metrics/overview", async (request, reply) => {
  const [totalEvents, totalProducts, totalUsers] = await Promise.all([
    prisma.event.count(),
    prisma.product.count(),
    prisma.user.count(),
  ]);

  if (isRedisAvailable()) {
    try {
      const redis = getRedis();
      const counters = await redis.hgetall("mercury:metrics:counters");
      if (counters && Object.keys(counters).length > 0) {
        return {
          totalEvents: parseInt(counters.total_events || "0"),
          totalProducts,
          totalUsers,
          breakdown: {
            VIEW: parseInt(counters.views || "0"),
            CLICK: parseInt(counters.clicks || "0"),
            CART: parseInt(counters.carts || "0"),
            PURCHASE: parseInt(counters.purchases || "0"),
          },
          fraud: {
            blockedCount: parseInt(counters.blocked || "0"),
            challengeCount: parseInt(counters.challenged || "0"),
            avgRiskScore: 0,
          },
          source: "redis",
        };
      }
    } catch (e) {
      console.error(e);
    }
  }

  // DB Fallback
  const byType = await prisma.event.groupBy({
    by: ["type"],
    _count: { type: true },
  });
  const breakdown: Record<string, number> = {};
  byType.forEach((group: any) => {
    breakdown[group.type] = group._count.type;
  });

  return {
    totalEvents,
    totalProducts,
    totalUsers,
    breakdown,
    fraud: { blockedCount: 0, challengeCount: 0, avgRiskScore: 0 }, // Simplified fallback
    source: "db",
  };
});

// Demo Story
fastify.post("/demo/story", async (request, reply) => {
  const { mode } = request.query as { mode?: string };
  const count = 30;

  // Async simulation
  (async () => {
    const products = await prisma.product.findMany({ take: 10 });
    const users = await prisma.user.findMany({ take: 2 });

    if (products.length === 0 || users.length === 0) return;

    for (let i = 0; i < count; i++) {
      const user = users[i % users.length];
      const product = products[Math.floor(Math.random() * products.length)];
      const types = ["VIEW", "CLICK", "CART", "PURCHASE"];
      const type = types[Math.floor(Math.random() * types.length)] || "VIEW";

      if (user && product) {
        const event = await prisma.event.create({
          data: {
            userId: user.id,
            productId: product.id,
            type,
            meta: {
              note: "Demo Story",
              decision: type === "PURCHASE" ? "ALLOW" : undefined,
            } as any,
          },
        });
        broadcast("EVENT_CREATED", event);
      }
      await new Promise((r) => setTimeout(r, mode === "fast" ? 50 : 500));
    }
  })();

  return { ok: true, message: "Demo story started", steps: count };
});

// Perf Metrics (Stub)
fastify.get("/metrics/perf", async () => {
  return {
    cache: { hits: 0, misses: 0, hitRate: "0.00" },
    api: { avgMs: "0.00" },
    redis: {
      available: isRedisAvailable(),
      url: process.env.REDIS_URL || "unknown",
    },
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Events Service running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
