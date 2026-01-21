import Fastify from "fastify";
import cors from "@fastify/cors";
import Stripe from "stripe";
import { HttpClient } from "@repo/http";

const fastify = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "4005");

fastify.register(cors, { origin: true });

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  {
    apiVersion: "2023-10-16",
  },
);

const riskClient = new HttpClient("http://localhost:4004"); // Risk Service

fastify.get("/health", async () => {
  return { service: "payments-service", status: "ok" };
});

fastify.post("/checkout/create-session", async (request, reply) => {
  const { items, userId } = request.body as { items: any[]; userId: string };

  // 1. Calculate Total (Simplified)
  const amount = items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0,
  );

  // 2. Check Risk
  try {
    const risk = await riskClient.post<{ decision: string; reasons: string[] }>(
      "/risk/score",
      {
        userId: userId || "guest",
        productId: items[0]?.id || "cart",
        amount,
      },
    );

    if (risk.decision === "BLOCK") {
      reply.code(403);
      return {
        error: "Transaction blocked due to high risk",
        reasons: risk.reasons,
      };
    }

    if (risk.decision === "CHALLENGE") {
      // Just warn for now in this demo, or require 3DS (not implemented here)
      console.log("Risk Challenge:", risk.reasons);
    }
  } catch (e) {
    console.error("Risk check failed", e);
    // Fail open or closed? Closed for safety.
    // reply.code(500); return { error: "Risk check failed" };
  }

  // 3. Create Stripe Session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: { name: item.name },
          unit_amount: item.price,
        },
        quantity: item.quantity || 1,
      })),
      mode: "payment",
      success_url: `${request.headers.origin || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.origin || "http://localhost:3000"}/cancel`,
      client_reference_id: userId,
    });

    return { id: session.id };
  } catch (e: any) {
    reply.code(500);
    return { error: e.message };
  }
});

fastify.post("/webhooks/stripe", async (request, reply) => {
  // Handle webhook
  return { received: true };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Payments Service running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
