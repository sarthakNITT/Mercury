import { describe, it, expect } from "vitest";
import { EventBodySchema } from "./index";

describe("EventBodySchema", () => {
  it("accepts valid payloads", () => {
    const validPayload = {
      userId: "user-123",
      productId: "prod-456",
      type: "VIEW",
      meta: { foo: "bar" },
    };
    const result = EventBodySchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts payloads without optional meta", () => {
    const validPayload = {
      userId: "user-123",
      productId: "prod-456",
      type: "CLICK",
    };
    const result = EventBodySchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects invalid event types", () => {
    const invalidPayload = {
      userId: "user-123",
      productId: "prod-456",
      type: "INVALID_TYPE",
    };
    const result = EventBodySchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const invalidPayload = {
      userId: "user-123",
      // Missing productId and type
    };
    const result = EventBodySchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it("rejects incorrect data types", () => {
    const invalidPayload = {
      userId: 123, // Should be string
      productId: "prod-456",
      type: "VIEW",
    };
    const result = EventBodySchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });
});
