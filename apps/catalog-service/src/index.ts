import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { ProductSchema } from "@repo/shared";

const fastify = Fastify({
  logger: {
    mixin: () => ({ service: "catalog-service" }),
  },
});

// Metrics
const startTime = Date.now();
let requestCount = 0;

fastify.addHook("onRequest", async (request) => {
  requestCount++;
  if (request.headers["x-trace-id"]) {
    request.id = request.headers["x-trace-id"] as string;
  }
});

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

const PORT = parseInt(process.env.PORT || "4001");

fastify.register(cors, { origin: true });

// Auth Middleware
fastify.addHook("preHandler", async (request, reply) => {
  const allowedPaths = ["/health", "/metrics", "/ready", "/seed"];
  if (allowedPaths.some((p) => request.routerPath?.startsWith(p))) return;

  const key = request.headers["x-service-key"];
  if (key !== (process.env.SERVICE_KEY || "dev-service-key")) {
    reply.code(401).send({ error: "Unauthorized Service Call" });
  }
});

fastify.get("/health", async () => {
  return {
    ok: true,
    service: "catalog-service",
    time: new Date().toISOString(),
  };
});

fastify.get("/ready", async () => {
  let dbStatus = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "up";
  } catch (e) {
    fastify.log.error(e);
  }

  return {
    ok: dbStatus === "up",
    service: "catalog-service",
    dependencies: {
      db: dbStatus,
      redis: "not_used",
    },
  };
});

fastify.get("/metrics", async () => {
  return {
    service: "catalog-service",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    requestsTotal: requestCount,
  };
});

// Get Products
fastify.get("/products", async (request, reply) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return products;
});

// Get Product by ID
fastify.get("/products/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (!product) {
    reply.code(404);
    return { error: "Product not found" };
  }
  return product;
});

// Seed System (Users + Products)
fastify.post("/seed", async (request, reply) => {
  try {
    const { count = 20 } = (request.body as { count?: number }) || {};

    // 1. Create Users
    const user1 = await prisma.user.create({ data: { name: "Alice Demo" } });
    const user2 = await prisma.user.create({ data: { name: "Bob Shopper" } });

    // 2. Create Products
    const categories = ["Electronics", "Fashion", "Books", "Fitness", "Home"];
    const productsData = [];

    for (let i = 1; i <= count; i++) {
      const category =
        categories[Math.floor(Math.random() * categories.length)] || "General";
      productsData.push({
        name: `${category} Product ${i}`,
        description: `Description for product ${i} in ${category}. Very high quality item.`,
        price: Math.floor(Math.random() * 10000) + 500,
        currency: "INR",
        category,
        imageUrl: `https://placehold.co/400?text=Product+${i}`,
      });
    }

    // Transaction
    await prisma.$transaction([
      ...productsData.map((p) => prisma.product.create({ data: p })),
      // Seed Configs
      prisma.appConfig.upsert({
        where: { key: "reco.weights" },
        update: {},
        create: {
          key: "reco.weights",
          valueJson: {
            categoryBoost: 0,
            trendingWeights: {
              VIEW: 0.2,
              CLICK: 0.6,
              CART: 2.0,
              PURCHASE: 5.0,
            },
            affinityBoost: 0,
          },
        },
      }),
      // Seed Risk Rules
      prisma.riskRule.create({
        data: {
          name: "High Amount",
          weight: 25,
          conditionJson: { minAmount: 200000 },
        },
      }),
      prisma.riskRule.create({
        data: {
          name: "High Velocity",
          weight: 30,
          conditionJson: { minVelocity: 3 },
        },
      }),
      prisma.riskRule.create({
        data: {
          name: "New Account",
          weight: 15,
          conditionJson: { isNewAccount: true },
        },
      }),
      // Seed Model Registry
      prisma.modelRegistry.create({
        data: {
          name: "reco-tf",
          version: "v1",
          status: "ACTIVE",
          modelPath: "file://local/model.json",
        },
      }),
    ]);

    return {
      message: `Seeded users, ${count} products, and default configs.`,
      users: [user1.id, user2.id],
    };
  } catch (e: any) {
    fastify.log.error(e);
    reply.code(500).send({ error: e.message, stack: e.stack });
    return;
  }
});

// Seed Products (Dev/Internal) - Keep for compatibility
fastify.post("/seed/products", async (request, reply) => {
  const { count = 20 } = (request.body as { count?: number }) || {};

  const categories = ["Electronics", "Fashion", "Books", "Fitness", "Home"];
  const productsData = [];

  for (let i = 1; i <= count; i++) {
    const category =
      categories[Math.floor(Math.random() * categories.length)] || "General";
    productsData.push({
      name: `${category} Product ${i}`,
      description: `Description for product ${i} in ${category}. Very high quality item.`,
      price: Math.floor(Math.random() * 10000) + 500,
      currency: "INR",
      category,
      imageUrl: `https://placehold.co/400?text=Product+${i}`,
    });
  }

  // Transaction
  await prisma.$transaction(
    productsData.map((p) => prisma.product.create({ data: p })),
  );

  return { message: `Seeded ${count} products` };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Catalog Service running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
