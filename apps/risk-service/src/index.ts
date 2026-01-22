import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { calculateRiskScore } from "./logic";

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

  const { decision, riskScore, reasons } = calculateRiskScore({
    amount,
    recentTxns,
    userCreatedAt: user?.createdAt,
  });

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
