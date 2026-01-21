import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import prisma from "./lib/prisma";
import fs from "node:fs";
import path from "node:path";

const fastify = Fastify({
  logger: true,
});

// Register CORS
fastify.register(cors, {
  origin: true, // Allow all origins for dev simplicity
});

// Schemas
const EventTypeSchema = z.enum(["VIEW", "CLICK", "CART", "PURCHASE"]);
const EventBodySchema = z.object({
  userId: z.string(),
  productId: z.string(),
  type: EventTypeSchema,
  meta: z.object({}).passthrough().optional(), // Allow any JSON object
});

// --- Routes ---

// Health Check
fastify.get("/health", async (request, reply) => {
  return { ok: true, service: "mercury-api", time: new Date().toISOString() };
});

// Seed Database
fastify.post("/seed", async (request, reply) => {
  // Clear existing data (optional, but good for demo)
  // For safety in this strict demo env, let's just create if not exists or add more.
  // Actually, let's truncate for a clean slate if requested, or just add.
  // The prompt implies a "Seed" action which usually sets up initial state.

  // 1. Create Users
  const user1 = await prisma.user.create({ data: { name: "Alice Demo" } });
  const user2 = await prisma.user.create({ data: { name: "Bob Shopper" } });

  // 2. Create Products
  const categories = ["Electronics", "Fashion", "Books", "Fitness", "Home"];
  const productsData = [];

  for (let i = 1; i <= 30; i++) {
    const category =
      categories[Math.floor(Math.random() * categories.length)] || "General";
    productsData.push({
      name: `${category} Product ${i}`,
      description: `Description for product ${i} in ${category}. Very high quality item.`,
      price: Math.floor(Math.random() * 10000) + 500, // 500 to 10500 cents
      currency: "INR",
      category,
      imageUrl: `https://placehold.co/400?text=Product+${i}`, // Simple placeholder
    });
  }

  // Use transaction for speed
  await prisma.$transaction(
    productsData.map((p) => prisma.product.create({ data: p })),
  );

  const productCount = await prisma.product.count();
  const userCount = await prisma.user.count();

  return {
    message: "Seeded successfully",
    products: productCount,
    users: userCount,
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

// Log Event
fastify.post("/events", async (request, reply) => {
  const body = request.body;

  // Validate
  const result = EventBodySchema.safeParse(body);
  if (!result.success) {
    reply.code(400);
    return { error: "Validation failed", details: result.error.issues };
  }

  const { userId, productId, type, meta } = result.data;

  // Verify user and product exist (optional but good)
  // For speed, just insert.

  const event = await prisma.event.create({
    data: {
      userId,
      productId,
      type,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });

  return event;
});

// Get Recent Events
fastify.get("/events/recent", async (request, reply) => {
  const limit = 20;
  const events = await prisma.event.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      product: true,
    },
  });

  // Parse meta back to JSON
  return events.map((e: any) => ({
    ...e,
    meta: e.meta ? JSON.parse(e.meta) : null,
  }));
});

// Metrics Overview
fastify.get("/metrics/overview", async (request, reply) => {
  const [totalEvents, totalProducts, totalUsers] = await Promise.all([
    prisma.event.count(),
    prisma.product.count(),
    prisma.user.count(),
  ]);

  const byType = await prisma.event.groupBy({
    by: ["type"],
    _count: { type: true },
  });

  // Transform byType to object
  const breakdown: Record<string, number> = {};
  byType.forEach((group: any) => {
    breakdown[group.type] = group._count.type;
  });

  return {
    totalEvents,
    totalProducts,
    totalUsers,
    breakdown,
  };
});

// Generate Demo Events
fastify.post("/events/generate", async (request, reply) => {
  const { count } = (request.query as { count?: string }) || {};
  const numEvents = count ? parseInt(count) : 50;

  // Get all users and products to pick relationships
  const users = await prisma.user.findMany({ select: { id: true } });
  const products = await prisma.product.findMany({ select: { id: true } });

  if (users.length === 0 || products.length === 0) {
    reply.code(400);
    return { error: "No users or products found. Please seed first." };
  }

  const eventsToCreate = [];
  const types = [
    "VIEW",
    "VIEW",
    "VIEW",
    "VIEW",
    "CLICK",
    "CLICK",
    "CART",
    "PURCHASE",
  ] as const; // Weighted distribution

  for (let i = 0; i < numEvents; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const type = types[Math.floor(Math.random() * types.length)] || "VIEW";

    if (user && product) {
      eventsToCreate.push({
        userId: user.id,
        productId: product.id,
        type: type,
        meta: JSON.stringify({ note: "Auto-generated demo event" }),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000)), // Random time in past ~3 hours
      });
    }
  }

  await prisma.event.createMany({
    data: eventsToCreate,
  });

  return { generated: numEvents };
});

// Start Server
const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: "0.0.0.0" });
    console.log(`Server listening on http://localhost:4000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
