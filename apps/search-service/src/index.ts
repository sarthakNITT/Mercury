import Fastify from "fastify";
import cors from "@fastify/cors";
import { Client } from "@elastic/elasticsearch";
import {
  getRedis,
  cacheGetJson,
  cacheSetJson,
  cacheScanDel,
} from "@repo/redis";
import { setupMetrics, metricsHandler, metrics } from "@repo/shared";
setupMetrics("search-service");

const fastify = Fastify({
  logger: {
    mixin: () => ({ service: "search-service" }),
  },
});

const PORT = parseInt(process.env.PORT || "4009");
const ELASTIC_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";

const esClient = new Client({ node: ELASTIC_URL });
const redis = getRedis();

fastify.register(cors, { origin: true });

// Middleware
fastify.addHook("onResponse", async (request, reply) => {
  metrics.httpRequestsTotal.inc({
    method: request.method,
    route: request.routerPath,
    status_code: reply.statusCode,
  });
});
fastify.addHook("preHandler", async (request, reply) => {
  const allowed = ["/health", "/metrics", "/ready", "/search"];
  if (allowed.some((p) => request.routerPath?.startsWith(p))) return;

  const key = request.headers["x-service-key"];
  if (key !== (process.env.SERVICE_KEY || "dev-service-key")) {
    reply.code(401).send({ error: "Unauthorized Service Call" });
  }
});

// Setup Index
async function setupIndex() {
  try {
    const exists = await esClient.indices.exists({ index: "products" });
    if (!exists) {
      await esClient.indices.create({
        index: "products",
        body: {
          mappings: {
            properties: {
              name: { type: "text" },
              description: { type: "text" },
              categoryId: { type: "keyword" },
              price: { type: "float" },
              createdAt: { type: "date" },
              stock: { type: "integer" },
            },
          },
        },
      });
      console.log("Created 'products' index");
    }
  } catch (e) {
    console.error("Elasticsearch setup failed", e);
  }
}

// Consumer for changes
const STREAM_KEY = "mercury:catalog:stream";
const GROUP_NAME = "search_group";
const CONSUMER_NAME = "search_consumer_1";

async function setupConsumer() {
  // Ensure group exists
  try {
    await redis.xgroup("CREATE", STREAM_KEY, GROUP_NAME, "0", "MKSTREAM");
  } catch (e: any) {
    // Group might exist, ignore
  }
}

async function consumeLoop() {
  while (true) {
    try {
      const results = await redis.xreadgroup(
        "GROUP",
        GROUP_NAME,
        CONSUMER_NAME,
        "COUNT",
        10,
        "BLOCK",
        5000,
        "STREAMS",
        STREAM_KEY,
        ">",
      );

      if (results) {
        // @ts-ignore
        const [stream, messages] = results[0];
        for (const msg of messages) {
          const [id, fields] = msg;
          // Provide a default empty object if fields is null/undefined, although in Redis stream it should be [key, val, key, val...]
          // Actually ioredis returns array of arrays? [id, [key, val, ...]]

          // Parse fields helper
          // fields is usually ["event", "{}", "data", "{}"]
          const data: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
          }

          if (
            data.type === "PRODUCT_CREATED" ||
            data.type === "PRODUCT_UPDATED"
          ) {
            const product = JSON.parse(data.payload || "{}");
            await esClient.index({
              index: "products",
              id: product.id,
              document: {
                id: product.id,
                name: product.name,
                description: product.description,
                categoryId: product.categoryId,
                price: product.price,
                stock: product.stock,
                createdAt: product.createdAt,
              },
            });
            await cacheScanDel("search:products");
          } else if (data.type === "PRODUCT_DELETED") {
            const { id } = JSON.parse(data.payload || "{}");
            await esClient.delete({ index: "products", id }).catch(() => {});
            await cacheScanDel("search:products");
          }

          await redis.xack(STREAM_KEY, GROUP_NAME, id);
        }
      }
    } catch (e) {
      console.error("Error consuming stream", e);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

fastify.get("/search/products", async (request, reply) => {
  const { q } = request.query as { q: string };
  if (!q) return { items: [] };

  const CACHE_KEY = `search:products:${JSON.stringify(request.query)}`;
  const cached = await cacheGetJson(CACHE_KEY);
  if (cached) {
    reply.header("x-cache", "HIT");
    return cached;
  }

  try {
    const result = await esClient.search({
      index: "products",
      query: {
        multi_match: {
          query: q,
          fields: ["name^3", "description"],
        },
      },
    });

    const items = result.hits.hits.map((h) => h._source);
    const response = { items, total: result.hits.total };
    await cacheSetJson(CACHE_KEY, response, 30);
    reply.header("x-cache", "MISS");
    return response;
  } catch (e) {
    return { items: [], error: "Search failed" };
  }
});

fastify.get("/health", async () => ({
  status: "ok",
  service: "search-service",
}));
fastify.get("/ready", async () => ({ status: "ok" }));
fastify.get("/metrics/prometheus", metricsHandler);

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Search Service running on port ${PORT}`);
    await setupIndex();
    await setupConsumer();
    consumeLoop();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
