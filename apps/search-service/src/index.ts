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

import { prisma } from "@repo/db";

const PORT = parseInt(process.env.PORT || "4009");
const ELASTIC_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const SEARCH_MODE =
  process.env.SEARCH_MODE ||
  (process.env.NODE_ENV === "production"
    ? "db"
    : process.env.ELASTICSEARCH_URL
      ? "elastic"
      : "db");

// ES Client (conditionally used)
const esClient =
  SEARCH_MODE === "elastic" ? new Client({ node: ELASTIC_URL }) : null;
const redis = getRedis();

fastify.register(cors, { origin: true });

// ... (Middleware remains the same)
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
  if (SEARCH_MODE !== "elastic" || !esClient) return;
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

// Consumer for changes (Only needed if creating/updating index, or maybe we want to keep cache valid?)
// For DB mode, we don't strictly need to index into ES, but maybe cache invalidation still matters?
// Yes, keep cache invalidation.
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
          const data: Record<string, string> = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
          }

          if (
            data.type === "PRODUCT_CREATED" ||
            data.type === "PRODUCT_UPDATED"
          ) {
            const product = JSON.parse(data.payload || "{}");
            if (SEARCH_MODE === "elastic" && esClient) {
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
            }
            await cacheScanDel("search:products");
          } else if (data.type === "PRODUCT_DELETED") {
            const { id } = JSON.parse(data.payload || "{}");
            if (SEARCH_MODE === "elastic" && esClient) {
              await esClient.delete({ index: "products", id }).catch(() => {});
            }
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
    let items = [];
    let total = 0;

    if (SEARCH_MODE === "elastic" && esClient) {
      const result = await esClient.search({
        index: "products",
        query: {
          multi_match: {
            query: q,
            fields: ["name^3", "description"],
          },
        },
      });
      items = result.hits.hits.map((h) => h._source);
      // @ts-ignore
      total = result.hits.total.value || result.hits.total;
      reply.header("x-search-source", "elastic");
    } else {
      // DB Mode with Hard Timeout
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DB_TIMEOUT")), 2000),
        );

        const dbQuery = prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 20,
        });

        items = (await Promise.race([dbQuery, timeoutPromise])) as any[];
        total = items.length;
        reply.header("x-search-source", "db");
      } catch (err: any) {
        if (err.message === "DB_TIMEOUT") {
          console.error("DB Search Timed Out");
          reply.header("x-search-source", "timeout_fallback");
        } else {
          console.error("DB Search Failed (Unreachable)", err);
          reply.header("x-search-source", "db_unreachable_fallback");
        }
        // Return empty results gracefully
        items = [];
        total = 0;
      }
    }

    const response = { items, total };
    await cacheSetJson(CACHE_KEY, response, 30);
    reply.header("x-cache", "MISS");
    // Ensure x-search-mode header is always set
    reply.header("x-search-mode", SEARCH_MODE);
    return response;
  } catch (e) {
    console.error("Search failed", e);
    return { items: [], error: "Search failed" };
  }
});

fastify.get("/health", async () => ({
  status: "ok",
  service: "search-service",
  mode: SEARCH_MODE,
}));

fastify.get("/ready", async () => {
  let dbStatus = "unknown";
  try {
    // Simple light check
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "up";
  } catch {
    dbStatus = "down";
  }
  return { status: "ok", db: dbStatus };
});

fastify.get("/metrics/prometheus", metricsHandler);

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(
      `Search Service running on port ${PORT} (Mode: ${SEARCH_MODE})`,
    );
    await setupIndex();
    await setupConsumer();
    consumeLoop();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
