import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import Dashboard from "../app/dashboard/page";

// Mock API
vi.mock("../lib/api", () => ({
  api: {
    getMetrics: vi.fn().mockResolvedValue({
      totalEvents: 100,
      totalProducts: 50,
      totalUsers: 20,
      breakdown: { VIEW: 50, PURCHASE: 10 },
      fraud: { blockedCount: 5, challengeCount: 2, avgRiskScore: 15.5 },
    }),
    getRecentEvents: vi.fn().mockResolvedValue([
      {
        id: 1,
        type: "VIEW",
        createdAt: new Date().toISOString(),
        user: { name: "Alice" },
        product: { name: "Item" },
      },
    ]),
    getFraudEvents: vi.fn().mockResolvedValue([]),
    getRecommendations: vi.fn().mockResolvedValue({ recommendations: [] }),
    trackEvent: vi.fn().mockResolvedValue({}),
    scoreRisk: vi.fn().mockResolvedValue({ decision: "ALLOW", riskScore: 10 }),
    runDemoStory: vi.fn(),
    seed: vi.fn(),
    generateDemoEvents: vi.fn(),
  },
}));

// Mock EventSource
const mockEventSource = {
  onopen: null,
  onmessage: null,
  onerror: null,
  close: vi.fn(),
};

global.EventSource = class {
  onopen = null;
  onmessage = null;
  onerror = null;
  close = vi.fn();
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mockEventSource as any;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("Dashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders metrics after loading", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Total Events")).toBeDefined();
      expect(screen.getByText("100")).toBeDefined();
      expect(screen.getByText("Blocked Txns")).toBeDefined();
      expect(screen.getByText("5")).toBeDefined();
    });
  });

  it("displays Judges Mode toggle", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Judges Mode")).toBeDefined();
    });
  });
});
