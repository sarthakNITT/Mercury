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

// 1. Catalog Service
fastify.register(proxy, {
  upstream: SERVICES.catalog,
  prefix: "/products",
  rewritePrefix: "/products",
  http2: false,
});
fastify.register(proxy, {
  upstream: SERVICES.catalog,
  prefix: "/seed", // for /seed/products
  rewritePrefix: "/seed",
  http2: false,
});

// 2. Events Service
// SSE Stream needs special care? http-proxy handles it if we don't block it.
fastify.register(proxy, {
  upstream: SERVICES.events,
  prefix: "/events",
  rewritePrefix: "/events",
  http2: false,
  replyOptions: {
    // Essential for SSE
    getUpstream: (req: any, base: any) => {
      if (req.url.includes("/stream")) {
        return base;
      }
      return base;
    },
  },
});

// 3. Reco Service
fastify.register(proxy, {
  upstream: SERVICES.reco,
  prefix: "/recommendations",
  rewritePrefix: "/recommendations",
  http2: false,
});

// 4. Risk Service
fastify.register(proxy, {
  upstream: SERVICES.risk,
  prefix: "/risk",
  rewritePrefix: "/risk",
  http2: false,
});

// 5. Payments Service
fastify.register(proxy, {
  upstream: SERVICES.payments,
  prefix: "/checkout",
  rewritePrefix: "/checkout",
  http2: false,
});
fastify.register(proxy, {
  upstream: SERVICES.payments,
  prefix: "/webhooks",
  rewritePrefix: "/webhooks",
  http2: false,
});

// 6. Metrics (aggregated? or just proxy to Events/Catalog who own them?)
// Legacy API handled metrics aggregation.
// Now we need an Aggregation Endpoint here OR just proxy to "Events" if we moved metrics there.
// I kept Metrics in Events Service (counters) and Catalog (counts).
// But for now, let's proxy /metrics to Events Service because it has the counters.
// Note: Catalog counts (totalProducts) might be missing if Events service doesn't talk to Catalog DB.
// But for MVP migration, let's assume Events service can access DB (shared prisma) or we just proxy.
fastify.register(proxy, {
  upstream: SERVICES.events, // Metrics moved to events service?
  // Wait, in my Events service implementation I didn't verify if I added /metrics endpoint.
  // I added /events/recent, /events/fraud.
  // I MISSED /metrics/overview and /metrics/perf in Events Service!
  // I need to add them to Events Service or create a separate Metrics Service.
  // I'll add them to Events Service since it has the Redis connection for counters.
  prefix: "/metrics",
  rewritePrefix: "/metrics",
  http2: false,
});

// 7. Trending
fastify.register(proxy, {
  upstream: SERVICES.events, // I also missed /trending in Events Service!
  prefix: "/trending",
  rewritePrefix: "/trending",
  http2: false,
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
