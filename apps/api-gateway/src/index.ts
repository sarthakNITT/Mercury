import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import proxy from "@fastify/http-proxy";

const fastify = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "4000");

// Services map
const SERVICES = {
  catalog: "http://localhost:4001",
  events: "http://localhost:4002",
  reco: "http://localhost:4003",
  risk: "http://localhost:4004",
  payments: "http://localhost:4005",
};

fastify.register(cors, { origin: true });

fastify.get("/health", async () => {
  return { service: "api-gateway", status: "ok" };
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
registerProxy(fastify, {
  upstream: SERVICES.events,
  prefix: "/metrics",
  rewritePrefix: "/metrics",
});

registerProxy(fastify, {
  upstream: SERVICES.events,
  prefix: "/trending",
  rewritePrefix: "/trending",
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`API Gateway running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
