import { describe, it, expect } from "vitest";
import { predictScore } from "./logic";

describe("predictScore", () => {
  it("returns deterministic output", () => {
    const features = [1, 0.5, 1, 0.5];
    const score1 = predictScore(features);
    const score2 = predictScore(features);
    expect(score1).toBe(score2);
  });

  it("score increases with higher trendingScore", () => {
    // Features: [categoryMatch, trending, userAffinity, priceBucket]
    // Weights: [0.3, 0.5, 0.2, -0.1]
    // Trending has weight 0.5 (positive)

    const lowTrending = predictScore([1, 0.1, 1, 0.5]);
    const highTrending = predictScore([1, 0.9, 1, 0.5]);

    expect(highTrending).toBeGreaterThan(lowTrending);
  });

  it("score increases with userAffinity", () => {
    // Affinity weight 0.2
    const noAffinity = predictScore([1, 0.5, 0, 0.5]);
    const withAffinity = predictScore([1, 0.5, 1, 0.5]);

    expect(withAffinity).toBeGreaterThan(noAffinity);
  });

  it("score decreases with higher priceBucket", () => {
    // Price weight -0.1 (negative)
    const lowPrice = predictScore([1, 0.5, 1, 0.1]);
    const highPrice = predictScore([1, 0.5, 1, 0.9]);

    expect(lowPrice).toBeGreaterThan(highPrice);
  });
});
