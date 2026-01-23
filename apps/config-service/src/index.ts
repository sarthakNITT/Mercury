import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { z } from "zod";
import { setupMetrics, metricsHandler, metrics } from "@repo/shared";
setupMetrics("config-service");

const fastify = Fastify({
  logger: {
    mixin: () => ({ service: "config-service" }),
  },
});

const PORT = parseInt(process.env.PORT || "4006");

fastify.register(cors, { origin: true });

fastify.addHook("onResponse", async (request, reply) => {
  metrics.httpRequestsTotal.inc({
    method: request.method,
    route: request.routerPath,
    status_code: reply.statusCode,
  });
});

// Auth Middleware
fastify.addHook("preHandler", async (request, reply) => {
  const allowedPaths = ["/health", "/ready", "/metrics"];
  if (allowedPaths.some((p) => request.routerPath?.startsWith(p))) return;

  const key = request.headers["x-service-key"];
  if (key !== (process.env.SERVICE_KEY || "dev-service-key")) {
    reply.code(401).send({ error: "Unauthorized Service Call" });
  }
});

fastify.get("/health", async () => {
  return { ok: true, service: "config-service" };
});

fastify.get("/ready", async () => {
  let db = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {}
  return { ok: db === "up", dependencies: { db } };
});

// App Configs
fastify.get("/configs", async () => {
  return await prisma.appConfig.findMany();
});

fastify.get("/configs/:key", async (request, reply) => {
  const { key } = request.params as { key: string };
  const config = await prisma.appConfig.findUnique({ where: { key } });
  if (!config) {
    reply.code(404);
    return { error: "Config not found" };
  }
  return config;
});

fastify.post("/configs/:key", async (request, reply) => {
  const { key } = request.params as { key: string };
  const body = request.body as any; // Allow arbitrary JSON

  // Validate that body is an object or value, not undefined
  if (body === undefined) {
    reply.code(400);
    return { error: "Body required" };
  }

  const config = await prisma.appConfig.upsert({
    where: { key },
    update: { valueJson: body },
    create: { key, valueJson: body },
  });
  return config;
});

// Risk Rules
fastify.get("/risk-rules", async () => {
  return await prisma.riskRule.findMany({ where: { enabled: true } });
});

fastify.get("/metrics/prometheus", metricsHandler);

fastify.post("/risk-rules", async (request, reply) => {
  const RiskRuleSchema = z.object({
    name: z.string(),
    weight: z.number(),
    conditionJson: z.object({}).passthrough(),
    enabled: z.boolean().optional(),
  });

  const result = RiskRuleSchema.safeParse(request.body);
  if (!result.success) {
    reply.code(400);
    return { error: result.error };
  }

  const { name, weight, conditionJson, enabled } = result.data;

  // Simple creation (no unique constraint on name forced by schema, but logical)
  const rule = await prisma.riskRule.create({
    data: { name, weight, conditionJson, enabled: enabled ?? true },
  });
  return rule;
});

// Model Registry
fastify.get("/model-registry/active", async (request, reply) => {
  const { name } = request.query as { name?: string };
  if (!name) {
    reply.code(400);
    return { error: "Name required" };
  }

  // Find latest active
  const model = await prisma.modelRegistry.findFirst({
    where: { name, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  if (!model) {
    reply.code(404);
    return { error: "Active model not found" };
  }
  return model;
});

fastify.post("/model-registry/activate", async (request, reply) => {
  const ActivateSchema = z.object({
    name: z.string(),
    version: z.string(),
    modelPath: z.string(),
  });

  const result = ActivateSchema.safeParse(request.body);
  if (!result.success) {
    reply.code(400);
    return { error: result.error };
  }

  const { name, version, modelPath } = result.data;

  // Deactivate others
  await prisma.modelRegistry.updateMany({
    where: { name, status: "ACTIVE" },
    data: { status: "ARCHIVED" },
  });

  // Create or Update new one as ACTIVE
  // We'll create a new entry for every training run usually, but here we just ensure this one is active.
  // The prompt says "Call config-service endpoint to activate model", implying we might need to insert it if it doesn't exist,
  // or just update it. Let's create a new record if it doesn't exist with these details, or update if it does.
  // Actually, usually training service creates the record.
  // "This trains a TF.js model... After training succeeds: Call config-service endpoint to activate model"
  // Let's assume we just create a NEW record or update existing one to ACTIVE.

  const model = await prisma.modelRegistry.create({
    data: {
      name,
      version,
      modelPath,
      status: "ACTIVE",
    },
  });

  return { success: true, model };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Config Service running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
