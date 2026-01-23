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

// --- CATEGORIES ---

// Get Categories
fastify.get("/categories", async () => {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
});

// Create Category
fastify.post("/categories", async (request, reply) => {
  // @ts-ignore
  const { CategoryCreateSchema } = await import("@repo/shared");
  const result = CategoryCreateSchema.safeParse(request.body);
  if (!result.success) {
    reply.code(400);
    return { error: "Validation failed", details: result.error.issues };
  }
  try {
    const category = await prisma.category.create({
      data: { name: result.data.name },
    });
    return category;
  } catch (e: any) {
    if (e.code === "P2002") {
      reply.code(409).send({ error: "Category already exists" });
      return;
    }
    throw e;
  }
});

fastify.get("/categories/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return reply.code(404).send({ error: "Category not found" });
  return category;
});

fastify.patch("/categories/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  // @ts-ignore
  const { CategoryUpdateSchema } = await import("@repo/shared");
  const result = CategoryUpdateSchema.safeParse(request.body);
  if (!result.success) {
    return reply.code(400).send({ error: "Validation failed" });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: result.data,
    });
    return category;
  } catch (e) {
    return reply.code(404).send({ error: "Category not found" });
  }
});

fastify.delete("/categories/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  // Check for products
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return reply
      .code(400)
      .send({ error: "Cannot delete category with existing products" });
  }
  try {
    await prisma.category.delete({ where: { id } });
    return { ok: true };
  } catch (e) {
    return reply.code(404).send({ error: "Category not found" });
  }
});

// --- PRODUCTS ---

// Get Products (Paginated + Filtered)
fastify.get("/products", async (request, reply) => {
  const {
    page = "1",
    pageSize = "20",
    categoryId,
    search,
    minPrice,
    maxPrice,
  } = request.query as any;

  const take = parseInt(pageSize);
  const skip = (parseInt(page) - 1) * take;

  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (minPrice) where.price = { gte: parseInt(minPrice) };
  if (maxPrice) where.price = { ...where.price, lte: parseInt(maxPrice) };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
    pagination: {
      page: parseInt(page),
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
});

// Create Product
fastify.post("/products", async (request, reply) => {
  // @ts-ignore
  const { ProductCreateSchema } = await import("@repo/shared");
  const result = ProductCreateSchema.safeParse(request.body);
  if (!result.success) {
    reply.code(400);
    return { error: "Validation failed", details: result.error.issues };
  }

  // Validate category exists
  const catExists = await prisma.category.findUnique({
    where: { id: result.data.categoryId },
  });
  if (!catExists) {
    return reply.code(400).send({ error: "Invalid categoryId" });
  }

  const product = await prisma.product.create({
    data: {
      name: result.data.name,
      description: result.data.description || "",
      price: result.data.price,
      categoryId: result.data.categoryId,
      imageUrl: result.data.imageUrl,
      stock: result.data.stock || 0,
    },
  });
  return product;
});

// Get Product
fastify.get("/products/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) {
    reply.code(404);
    return { error: "Product not found" };
  }
  return product;
});

// Update Product
fastify.patch("/products/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  // @ts-ignore
  const { ProductUpdateSchema } = await import("@repo/shared");
  const result = ProductUpdateSchema.safeParse(request.body);
  if (!result.success) {
    return reply.code(400).send({ error: "Validation failed" });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: result.data,
    });
    return product;
  } catch (e) {
    return reply.code(404).send({ error: "Product not found" });
  }
});

// Delete Product
fastify.delete("/products/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  try {
    await prisma.product.delete({ where: { id } });
    return { ok: true };
  } catch (e) {
    return reply.code(404).send({ error: "Product not found" });
  }
});

// Seed System (Updated for Relations)
fastify.post("/seed", async (request, reply) => {
  try {
    const { count = 20 } = (request.body as { count?: number }) || {};

    // 1. Create Categories
    const categoriesList = [
      "Electronics",
      "Fashion",
      "Books",
      "Fitness",
      "Home",
    ];
    const categoryMap: Record<string, string> = {};

    for (const name of categoriesList) {
      const cat = await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      categoryMap[name] = cat.id;
    }

    // 2. Create Users (with email)
    const user1 = await prisma.user.upsert({
      where: { email: "alice@demo.com" },
      update: {},
      create: { name: "Alice Demo", email: "alice@demo.com" },
    });
    const user2 = await prisma.user.upsert({
      where: { email: "bob@shopper.com" },
      update: {},
      create: { name: "Bob Shopper", email: "bob@shopper.com" },
    });

    // 3. Create Products
    const productsData = [];
    for (let i = 1; i <= count; i++) {
      const catName =
        categoriesList[Math.floor(Math.random() * categoriesList.length)] ||
        "Electronics";

      const catId = categoryMap[catName];
      if (!catId) continue; // Should not happen

      productsData.push({
        name: `${catName} Product ${i}`,
        description: `Description for product ${i} in ${catName}.`,
        price: Math.floor(Math.random() * 10000) + 500,
        currency: "INR",
        categoryId: catId,
        imageUrl: `https://placehold.co/400?text=Product+${i}`,
        stock: 50,
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
    ]);

    return {
      message: `Seeded users, categories, and ${count} products.`,
      users: [user1.id, user2.id],
    };
  } catch (e: any) {
    fastify.log.error(e);
    reply.code(500).send({ error: e.message });
    return;
  }
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
