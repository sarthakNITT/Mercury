import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@repo/db";
import { ProductSchema } from "@repo/shared";

const fastify = Fastify({ logger: true });

const PORT = parseInt(process.env.PORT || "4001");

fastify.register(cors, { origin: true });

fastify.get("/health", async () => {
  return { service: "catalog-service", status: "ok" };
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

// Seed Products (Dev/Internal)
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
