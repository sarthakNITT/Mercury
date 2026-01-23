import { getRedis, isRedisAvailable } from "@repo/redis";
import dotenv from "dotenv";

dotenv.config();

const STREAM_KEY = "mercury:events";
const GROUP_NAME = "mercury-workers";
const CONSUMER_NAME = process.env.HOSTNAME || "worker-1";

async function main() {
  console.log("Starting Worker Service...");

  // Wait for Redis connection
  let attempts = 0;
  while (!isRedisAvailable() && attempts < 10) {
    console.log("Waiting for Redis...");
    await new Promise((r) => setTimeout(r, 1000));
    getRedis(); // Trigger connection
    attempts++;
  }

  if (!isRedisAvailable()) {
    console.error("Redis not available. Exiting.");
    process.exit(1);
  }

  const redis = getRedis();

  // Create Consumer Group
  try {
    await redis.xgroup("CREATE", STREAM_KEY, GROUP_NAME, "$", "MKSTREAM");
    console.log(`Created consumer group ${GROUP_NAME}`);
  } catch (err: any) {
    if (err.message.includes("BUSYGROUP")) {
      console.log(`Consumer group ${GROUP_NAME} already exists.`);
    } else {
      console.error("Error creating consumer group:", err);
    }
  }

  // Metric: Stream Lag
  const { register, Gauge } = await import("prom-client");
  const lagGauge = new Gauge({
    name: "mercury_worker_stream_lag",
    help: "Approximate stream length",
  });

  const BATCH_SIZE = parseInt(process.env.WORKER_BATCH_SIZE || "50");
  const BLOCK_MS = parseInt(process.env.WORKER_BLOCK_MS || "5000");

  console.log(`Worker ${CONSUMER_NAME} started listening on ${STREAM_KEY}`);

  while (true) {
    try {
      // Update Lag Metric
      const len = await redis.xlen(STREAM_KEY);
      lagGauge.set(len);

      // Read from stream
      const response = await redis.xreadgroup(
        "GROUP",
        GROUP_NAME,
        CONSUMER_NAME,
        "COUNT",
        BATCH_SIZE,
        "BLOCK",
        BLOCK_MS,
        "STREAMS",
        STREAM_KEY,
        ">",
      );

      if (response && (response as any).length > 0) {
        const [_, messages] = (response as any)[0];

        for (const message of messages) {
          const id = message[0];
          const fields = message[1];
          const event: Record<string, string> = {};

          for (let i = 0; i < fields.length; i += 2) {
            event[fields[i]] = fields[i + 1];
          }

          try {
            await processEvent(event);
            await redis.xack(STREAM_KEY, GROUP_NAME, id);
          } catch (processErr) {
            console.error(`Failed to process event ${id}:`, processErr);
            // Do NOT XACK, so it remains in PEL for potential retry/claim
          }
        }
      }
    } catch (err) {
      console.error("Error processing stream:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function processEvent(event: Record<string, string>) {
  const redis = getRedis();
  const { type, productId, userId, meta } = event;

  console.log(`Processing event: ${type} for product ${productId || "N/A"}`);

  // 1. Update Trending ZSET
  if (productId) {
    let score = 0;
    if (type === "VIEW") score = 1;
    else if (type === "CLICK") score = 3;
    else if (type === "CART") score = 6;
    else if (type === "PURCHASE") score = 10;

    if (score > 0) {
      await redis.zincrby("mercury:trending:24h", score, productId);
      await redis.expire("mercury:trending:24h", 86400);
    }
  }

  // 2. Update Counters Hash
  const pipeline = redis.pipeline();
  pipeline.hincrby("mercury:metrics:counters", "total_events", 1);

  if (type === "VIEW") pipeline.hincrby("mercury:metrics:counters", "views", 1);
  if (type === "CLICK")
    pipeline.hincrby("mercury:metrics:counters", "clicks", 1);
  if (type === "CART") pipeline.hincrby("mercury:metrics:counters", "carts", 1);
  if (type === "PURCHASE") {
    pipeline.hincrby("mercury:metrics:counters", "purchases", 1);

    // Attempt to parse meta if it's a string, though in XADD it comes as string
    try {
      if (meta) {
        const parsedMeta = JSON.parse(meta);
        if (parsedMeta.decision === "BLOCK")
          pipeline.hincrby("mercury:metrics:counters", "blocked", 1);
        if (parsedMeta.decision === "CHALLENGE")
          pipeline.hincrby("mercury:metrics:counters", "challenged", 1);
        if (parsedMeta.decision === "ALLOW")
          pipeline.hincrby("mercury:metrics:counters", "allowed", 1);
      }
    } catch (e) {}
  }

  await pipeline.exec();
}

// Graceful Shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  process.exit(0);
});

import Fastify from "fastify";
import { setupMetrics, metricsHandler } from "@repo/shared";

// Metrics Server
const fastify = Fastify({ logger: false });
setupMetrics("worker-service");

fastify.get("/metrics/prometheus", metricsHandler);
fastify.get("/health", async () => ({ status: "ok" }));

fastify.listen({ port: 4010, host: "0.0.0.0" }).catch(console.error);

main().catch(console.error);
