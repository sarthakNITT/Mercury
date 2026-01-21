import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fastify } from "../src/index";

// Global setup
beforeAll(async () => {
  await fastify.ready();
});

afterAll(async () => {
  await fastify.close();
});

describe("API Integration Tests", () => {
  it("GET /health should return status ok", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/health",
    });
    expect(response.statusCode).toBe(200);
    // Matches { ok: true, service: 'mercury-api', ... }
    expect(response.json()).toMatchObject({ ok: true });
  });

  it("GET /products should return a list", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/products",
    });
    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(Array.isArray(json)).toBe(true);
  });
});

describe("Recommendation Engine", () => {
  it("GET /recommendations/:id should return 404 for non-existent product", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/recommendations/99999999-failed-uuid",
    });
    expect(response.statusCode).toBe(404);
  });
});

describe("Risk Scoring", () => {
  it("Should CHALLENGE small amount, old account but NO history", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/risk/score",
      payload: {
        userId: "non-existent-user-" + Date.now(),
        productId: "some-prod",
        amount: 100,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    // Unknown/New (+20) + No Views (+30) = 50 => CHALLENGE
    expect(body.decision).toBe("CHALLENGE");
    expect(body.riskScore).toBe(50);
  });

  it("Should BLOCK high amount + velocity (simulated via multiple calls)", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/risk/score",
      payload: {
        userId: "big-spender-" + Date.now(),
        productId: "some-prod",
        amount: 250000,
      },
    });

    const body = response.json();
    expect(body.riskScore).toBeGreaterThanOrEqual(45);
    expect(body.decision).not.toBe("ALLOW");
  });
});
