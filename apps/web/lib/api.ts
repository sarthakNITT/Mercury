const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
}

export interface Metrics {
  totalEvents: number;
  totalProducts: number;
  totalUsers: number;
  breakdown: Record<string, number>;
  fraud: {
    blockedCount: number;
    challengeCount: number;
    avgRiskScore: number;
  };
}

export interface Event {
  id: string;
  type: string;
  product?: Product;
  user?: { name: string };
  createdAt: string;
}

export interface Recommendation {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
  score: number;
  reason: string;
}

export interface RiskResult {
  riskScore: number;
  decision: "ALLOW" | "CHALLENGE" | "BLOCK";
  reasons: string[];
}

export interface TrendingItem {
  product: Product;
  score: number;
}

export const api = {
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_URL}/products`);
    const json = await res.json();
    return json.data || [];
  },

  getProduct: async (id: string): Promise<Product> => {
    const res = await fetch(`${API_URL}/products/${id}`);
    if (!res.ok) throw new Error("Product not found");
    return res.json();
  },

  trackEvent: async (
    userId: string,
    type: string,
    productId: string,
    meta?: unknown,
  ) => {
    await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type, productId, meta }),
    });
  },

  getMetrics: async (): Promise<Metrics> => {
    const res = await fetch(`${API_URL}/metrics/overview`);
    return res.json();
  },

  getRecentEvents: async (): Promise<Event[]> => {
    const res = await fetch(`${API_URL}/events/recent`);
    return res.json();
  },

  seed: async () => {
    const res = await fetch(`${API_URL}/seed`, { method: "POST" });
    return res.json();
  },

  generateDemoEvents: async (count: number = 50) => {
    const res = await fetch(`${API_URL}/events/generate?count=${count}`, {
      method: "POST",
    });
    return res.json();
  },

  getRecommendations: async (
    productId: string,
    userId?: string,
  ): Promise<{ productId: string; recommendations: Recommendation[] }> => {
    const res = await fetch(
      `${API_URL}/recommendations/${productId}?userId=${userId || ""}`,
    );
    return res.json();
  },

  scoreRisk: async (
    userId: string,
    productId: string,
    amount: number,
  ): Promise<RiskResult> => {
    const res = await fetch(`${API_URL}/risk/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId, amount }),
    });
    return res.json();
  },

  getTrending: async (
    limit: number = 10,
  ): Promise<{ limit: number; items: TrendingItem[]; source: string }> => {
    const res = await fetch(`${API_URL}/trending?limit=${limit}`);
    return res.json();
  },

  getFraudEvents: async (): Promise<Event[]> => {
    const res = await fetch(`${API_URL}/events/fraud`);
    return res.json();
  },

  runDemoStory: async (mode: string = "normal"): Promise<unknown> => {
    const res = await fetch(`${API_URL}/demo/story?mode=${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps: 30 }),
    });
    return res.json();
  },

  createCheckoutSession: async (
    userId: string,
    items: { id: string; price: number; quantity: number; name?: string }[],
  ): Promise<CheckoutResponse> => {
    const res = await fetch(`${API_URL}/checkout/create-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, items }),
    });
    return res.json();
  },

  getPaymentStatus: async (): Promise<{ enabled: boolean }> => {
    try {
      const res = await fetch(`${API_URL}/checkout/status`);
      if (!res.ok) return { enabled: false };
      return res.json();
    } catch {
      return { enabled: false };
    }
  },
};

export interface CheckoutResponse {
  url?: string;
  sessionId?: string;
  riskScore?: number;
  decision?: string;
  error?: string;
  reasons?: string[];
}
