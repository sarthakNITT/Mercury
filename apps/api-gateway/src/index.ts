import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import proxy from "@fastify/http-proxy";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import compress from "@fastify/compress";
import etag from "@fastify/etag";
import crypto from "node:crypto";
import {
  EventBodySchema,
  RiskScoreSchema,
  CheckoutSessionSchema,
} from "@repo/shared";

const fastify = Fastify({
  logger: {
    mixin: () => ({ service: "api-gateway" }),
  },
  genReqId: () => crypto.randomUUID(),
  bodyLimit: 1048576, // 1MB
});

// Security Headers
// Security Headers
fastify.register(helmet, { global: true });
fastify.register(compress, { global: true });
fastify.register(etag);

// Cache Headers
fastify.addHook("onSend", async (request, reply, payload) => {
  if (request.method !== "GET") return payload;

  const url = request.url;
  if (url.startsWith("/products") || url.startsWith("/categories")) {
    reply.header("Cache-Control", "public, max-age=10");
  } else if (url.startsWith("/metrics")) {
    reply.header("Cache-Control", "no-store");
  }
  return payload;
});

// Rate Limiting
fastify.register(rateLimit, {
  max: (req, key) => {
    const url = req.url;
    if (url === "/checkout/create-session" && req.method === "POST") return 20;
    if (url === "/risk/score" && req.method === "POST") return 60;
    if (url === "/events" && req.method === "POST") return 120;
    if (url === "/events/stream" && req.method === "GET") return 30;
    return 100;
  },
  timeWindow: "1 minute",
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

  const statusCode = error.statusCode || 500;
  // Handle Rate Limit Error (429)
  if (statusCode === 429) {
    reply.status(429).send({
      ok: false,
      error: "RATE_LIMITED",
      message: error.message || "Rate limit exceeded",
      traceId: request.id,
    });
    return;
  }

  reply.status(statusCode).send({
    ok: false,
    error: error.name || "Internal Server Error",
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
  media: process.env.MEDIA_URL || "http://localhost:4008",
  search: process.env.SEARCH_URL || "http://localhost:4009",
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

// Metrics
import { setupMetrics, metricsHandler } from "@repo/shared";
setupMetrics("api-gateway");

fastify.get("/metrics", async () => {
  return {
    service: "api-gateway",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    requestsTotal: requestCount,
  };
});

fastify.get("/metrics/prometheus", metricsHandler);

// --- Validation Logic ---
// We validate request bodies here before they are proxied.
fastify.addHook("preHandler", async (request, reply) => {
  const { url, method } = request;

  if (method === "POST" || method === "PATCH") {
    // Import Schemas dynamically to avoid load-time issues if shared isn't ready
    // @ts-ignore
    const {
      CheckoutSessionSchema,
      RiskScoreSchema,
      EventBodySchema,
      ProductCreateSchema,
      ProductUpdateSchema,
      CategoryCreateSchema,
      CategoryUpdateSchema,
      UserCreateSchema,
      UserUpdateSchema,
    } = await import("@repo/shared");

    if (url === "/checkout/create-session") {
      const result = CheckoutSessionSchema.safeParse(request.body);
      if (!result.success) {
        reply.code(400).send({
          ok: false,
          error: "VALIDATION_ERROR",
          message: "Invalid Checkout format",
          details: result.error.issues,
          traceId: request.id,
        });
        return request;
      }
    } else if (url === "/risk/score") {
      const result = RiskScoreSchema.safeParse(request.body);
      if (!result.success) {
        reply.code(400).send({
          ok: false,
          error: "VALIDATION_ERROR",
          message: "Invalid Risk Score format",
          details: result.error.issues,
          traceId: request.id,
        });
        return request;
      }
    } else if (url === "/events") {
      const result = EventBodySchema.safeParse(request.body);
      if (!result.success) {
        reply.code(400).send({
          ok: false,
          error: "VALIDATION_ERROR",
          message: "Invalid Event format",
          details: result.error.issues,
          traceId: request.id,
        });
        return request;
      }
    } else if (url.startsWith("/products")) {
      const schema =
        method === "POST" ? ProductCreateSchema : ProductUpdateSchema;
      const result = schema.safeParse(request.body);
      if (!result.success) {
        reply
          .code(400)
          .send({ error: "Validation Failed", details: result.error.issues });
        return request;
      }
    } else if (url.startsWith("/categories")) {
      const schema =
        method === "POST" ? CategoryCreateSchema : CategoryUpdateSchema;
      const result = schema.safeParse(request.body);
      if (!result.success) {
        reply
          .code(400)
          .send({ error: "Validation Failed", details: result.error.issues });
        return request;
      }
    } else if (url.startsWith("/users")) {
      const schema = method === "POST" ? UserCreateSchema : UserUpdateSchema;
      const result = schema.safeParse(request.body);
      if (!result.success) {
        reply
          .code(400)
          .send({ error: "Validation Failed", details: result.error.issues });
        return request;
      }
    }
  }
});

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

registerProxy(fastify, {
  upstream: SERVICES.catalog,
  prefix: "/categories",
  rewritePrefix: "/categories",
});

registerProxy(fastify, {
  upstream: SERVICES.events, // Users are in events-service
  prefix: "/users",
  rewritePrefix: "/users",
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

// 7. Config Service
registerProxy(fastify, {
  upstream: process.env.CONFIG_URL || "http://localhost:4006",
  prefix: "/configs",
  rewritePrefix: "/configs",
});

registerProxy(fastify, {
  upstream: process.env.CONFIG_URL || "http://localhost:4006",
  prefix: "/risk-rules",
  rewritePrefix: "/risk-rules",
});

registerProxy(fastify, {
  upstream: process.env.CONFIG_URL || "http://localhost:4006",
  prefix: "/model-registry",
  rewritePrefix: "/model-registry",
});

// 8. Training Service
registerProxy(fastify, {
  upstream: process.env.TRAINING_URL || "http://localhost:4007",
  prefix: "/train",
  rewritePrefix: "/train",
});

// 9. Media Service
registerProxy(fastify, {
  upstream: SERVICES.media,
  prefix: "/uploads",
  rewritePrefix: "/uploads",
});

// 10. Search Service
registerProxy(fastify, {
  upstream: SERVICES.search,
  prefix: "/search",
  rewritePrefix: "/search",
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
