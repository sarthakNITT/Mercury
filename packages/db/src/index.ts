import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ||
        "postgresql://mercury:mercury_password@localhost:5432/mercury_db?schema=public",
    },
  },
});

export * from "@prisma/client";
