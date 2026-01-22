import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import proxy from "@fastify/http-proxy";
import crypto from "node:crypto";

const fastify = Fastify({
  logger: {
    mixin: () => ({ service: "api-gateway" }),
  },
  genReqId: () => crypto.randomUUID(),
});

// Metrics
const startTime = Date.now();
let requestCount = 0;

fastify.addHook("onRequest", async (request) => {
  requestCount++;
});

// Response Logger Hook
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

// 404 Handler
fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    ok: false,
    error: "Not Found",
    message: `Route ${request.method}:${request.url} not found`,
    traceId: request.id,
  });
});

// Error Handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  reply.status(500).send({
    ok: false,
    error: error.name,
    message: error.message,
    traceId: request.id,
  });
});

const PORT = parseInt(process.env.PORT || "4000");

// Services map
const SERVICES = {
  catalog: process.env.CATALOG_URL || "http://localhost:4001",
  events: process.env.EVENTS_URL || "http://localhost:4002",
  reco: process.env.RECO_URL || "http://localhost:4003",
  risk: process.env.RISK_URL || "http://localhost:4004",
  payments: process.env.PAYMENTS_URL || "http://localhost:4005",
};

fastify.register(cors, { origin: true });

fastify.get("/health", async () => {
  return { ok: true, service: "api-gateway", time: new Date().toISOString() };
});

fastify.get("/ready", async () => {
  return {
    ok: true,
    service: "api-gateway",
    dependencies: {
      db: "not_used",
      redis: "not_used",
    },
  };
});

fastify.get("/metrics", async () => {
  return {
    service: "api-gateway",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    requestsTotal: requestCount,
  };
});

// --- Proxy Rules ---
import { registerProxy } from "./proxy";

// 1. Catalog Service
registerProxy(fastify, {
  upstream: SERVICES.catalog,
  prefix: "/products",
  rewritePrefix: "/products",
});

registerProxy(fastify, {
  upstream: SERVICES.catalog,
  prefix: "/seed",
  rewritePrefix: "/seed",
});

// 2. Events Service (SSE)
registerProxy(fastify, {
  upstream: SERVICES.events,
  prefix: "/events",
  rewritePrefix: "/events",
  isSSE: true, // Handles /events/stream
});

// 3. Reco Service
registerProxy(fastify, {
  upstream: SERVICES.reco,
  prefix: "/recommendations",
  rewritePrefix: "/recommendations",
});

// 4. Risk Service
registerProxy(fastify, {
  upstream: SERVICES.risk,
  prefix: "/risk",
  rewritePrefix: "/risk",
});

// 5. Payments Service
registerProxy(fastify, {
  upstream: SERVICES.payments,
  prefix: "/checkout",
  rewritePrefix: "/checkout",
});

registerProxy(fastify, {
  upstream: SERVICES.payments,
  prefix: "/webhooks",
  rewritePrefix: "/webhooks",
});

// 6. Metrics & Trending (Events Service)
// 6. Metrics & Trending (Events Service)
registerProxy(fastify, {
  upstream: SERVICES.events,
  prefix: "/metrics/overview",
  rewritePrefix: "/metrics/overview",
});

registerProxy(fastify, {
  upstream: SERVICES.events,
  prefix: "/metrics/perf",
  rewritePrefix: "/metrics/perf",
});

registerProxy(fastify, {
  upstream: SERVICES.events,
  prefix: "/trending",
  rewritePrefix: "/trending",
});

registerProxy(fastify, {
  upstream: SERVICES.events,
  prefix: "/demo",
  rewritePrefix: "/demo",
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`API Gateway running on port ${PORT}`);
    console.log("Services Configured:");
    console.table(SERVICES);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
