import Fastify from "fastify";
import cors from "@fastify/cors";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const fastify = Fastify({
  logger: {
    mixin: () => ({ service: "media-service" }),
  },
});

const PORT = parseInt(process.env.PORT || "4008");

fastify.register(cors, { origin: true });

// S3 / R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

// Middleware for service key
fastify.addHook("preHandler", async (request, reply) => {
  const allowed = ["/health", "/metrics", "/ready"];
  if (allowed.some((p) => request.routerPath?.startsWith(p))) return;

  // Presign might be public or protected? Let's protect it.
  const key = request.headers["x-service-key"];
  if (key !== (process.env.SERVICE_KEY || "dev-service-key")) {
    reply.code(401).send({ error: "Unauthorized Service Call" });
  }
});

fastify.post("/uploads/presign", async (request, reply) => {
  const { filename, contentType } = request.body as {
    filename: string;
    contentType: string;
  };

  if (!filename || !contentType) {
    return reply.code(400).send({ error: "Missing filename or contentType" });
  }

  // Sanitize filename
  const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, "");
  const key = `${Date.now()}-${cleanName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    const publicUrl = `${R2_PUBLIC_BASE_URL}/${key}`;

    return { uploadUrl, publicUrl, key };
  } catch (e) {
    console.error(e);
    return reply.code(500).send({ error: "Failed to generate presigned URL" });
  }
});

fastify.get("/health", async () => ({
  status: "ok",
  service: "media-service",
}));
fastify.get("/ready", async () => ({ status: "ok" }));
fastify.get("/metrics", async () => ({ status: "ok" }));
fastify.get("/metrics/prometheus", async (request, reply) => {
  const { register } = await import("prom-client");
  reply.header("Content-Type", register.contentType);
  return register.metrics();
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Media Service running on port ${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
