import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";

const fastify = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "4004");

fastify.register(cors, { origin: true });

fastify.get("/health", async () => {
  return { service: "risk-service", status: "ok" };
});

fastify.post("/risk/score", async (request, reply) => {
  const { userId, productId, amount } = request.body as {
    userId: string;
    productId: string;
    amount: number;
  };

  let riskScore = 0;
  const reasons: string[] = [];

  // 1. Amount Rules
  if (amount >= 200000) {
    // 2000.00
    riskScore += 25;
    reasons.push("High Transaction Value");
  }

  // 2. Velocity Rules (Postgres query)
  const recentTxns = await prisma.event.count({
    where: {
      userId,
      type: "PURCHASE",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    },
  });

  if (recentTxns > 3) {
    riskScore += 30;
    reasons.push("High Purchase Velocity");
  }

  // 3. User History
  // New account check (simplified)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && Date.now() - user.createdAt.getTime() < 24 * 60 * 60 * 1000) {
    riskScore += 15;
    reasons.push("New Account");
  }

  // Decision
  let decision: "ALLOW" | "CHALLENGE" | "BLOCK" = "ALLOW";
  if (riskScore > 80) decision = "BLOCK";
  else if (riskScore > 40) decision = "CHALLENGE";

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
