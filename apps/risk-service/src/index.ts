import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { calculateRiskScore, RiskRule } from "./logic";
import { HttpClient } from "@repo/http";
import { setupMetrics, metricsHandler, metrics } from "@repo/shared";
setupMetrics("risk-service");

const CONFIG_URL = process.env.CONFIG_URL || "http://localhost:4006";
const configClient = new HttpClient(CONFIG_URL);

let cachedRules: RiskRule[] = [];
let lastCacheTime = 0;
const CACHE_TTL = 60000;

async function getRiskRules(): Promise<RiskRule[]> {
  if (Date.now() - lastCacheTime < CACHE_TTL && cachedRules.length > 0) {
    return cachedRules;
  }

  try {
    // In a real scenario, use service key for internal auth
    // Check http client support for headers or modify here
    // For now, assuming internal network trust or modify http package later
    // But wait, HttpClient usually wraps fetch.
    // We need to pass headers. The @repo/http implementation is simple.
    // Let's assume standard fetch for now if HttpClient doesn't support headers easily without instance config.
    // Actually, let's look at HttpClient usage pattern or just use fetch directly for simplicity here.

    const response = await fetch(`${CONFIG_URL}/risk-rules`, {
      headers: {
        "x-service-key": process.env.SERVICE_KEY || "dev-service-key",
      },
    });

    if (response.ok) {
      const rules = (await response.json()) as any[];
      cachedRules = rules.map((r) => ({
        name: r.name,
        weight: r.weight,
        conditionJson: r.conditionJson,
      }));
      lastCacheTime = Date.now();
      return cachedRules;
    }
  } catch (e) {
    console.error("Failed to fetch risk rules, using fallback/cache", e);
  }

  return cachedRules;
}

const fastify = Fastify({
  logger: {
    mixin: () => ({ service: "risk-service" }),
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
  metrics.httpRequestsTotal.inc({
    method: request.method,
    route: request.routerPath,
    status_code: reply.statusCode,
  });
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
const PORT = parseInt(process.env.PORT || "4004");

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

fastify.get("/health", async () => {
  return { ok: true, service: "risk-service", time: new Date().toISOString() };
});

fastify.get("/ready", async () => {
  let dbStatus = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "up";
  } catch (e) {
    fastify.log.error(e);
  }

  return {
    ok: dbStatus === "up",
    service: "risk-service",
    dependencies: {
      db: dbStatus,
      redis: "not_used",
    },
  };
});

fastify.get("/metrics", async () => {
  return {
    service: "risk-service",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    requestsTotal: requestCount,
  };
});

fastify.get("/metrics/prometheus", metricsHandler);

fastify.get("/risk/config", async () => {
  const rules = await getRiskRules();
  return { rules, source: lastCacheTime > 0 ? "config-service" : "fallback" };
});

fastify.post("/risk/score", async (request, reply) => {
  const { userId, productId, amount } = request.body as {
    userId: string;
    productId: string;
    amount: number;
  };

  // 2. Velocity Rules (Postgres query)
  const recentTxns = await prisma.event.count({
    where: {
      userId,
      type: "PURCHASE",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Fetch Rules
  const rules = await getRiskRules();

  const { decision, riskScore, reasons } = calculateRiskScore(
    {
      amount,
      recentTxns,
      userCreatedAt: user?.createdAt,
    },
    rules,
  );

  return {
    decision,
    riskScore,
    reasons,
    timestamp: new Date().toISOString(),
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Risk Service running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
