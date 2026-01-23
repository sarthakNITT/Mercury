import { describe, it, expect } from "vitest";

describe("Training Service Basic Check", () => {
  it("should have a valid test environment", () => {
    expect(true).toBe(true);
  });

  it("should be able to perform basic math", () => {
    expect(1 + 1).toBe(2);
  });
});
