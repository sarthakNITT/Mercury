import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { calculateRiskScore } from "./logic";

const fastify = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "4004");

fastify.register(cors, { origin: true });

// Auth Middleware
fastify.addHook("preHandler", async (request, reply) => {
  const allowedPaths = ["/health", "/metrics"];
  if (allowedPaths.some((p) => request.routerPath?.startsWith(p))) return;

  const key = request.headers["x-service-key"];
  if (key !== (process.env.SERVICE_KEY || "dev-service-key")) {
    reply.code(401).send({ error: "Unauthorized Service Call" });
  }
});

fastify.get("/health", async () => {
  return { service: "risk-service", status: "ok" };
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
