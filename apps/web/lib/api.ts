import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

export interface CheckoutResponse {
  url?: string;
  sessionId?: string;
  riskScore?: number;
  decision?: string;
  error?: string;
  reasons?: string[];
}

export const api = {
  getProducts: async (): Promise<Product[]> => {
    const { data } = await client.get("/products");
    return data.data || [];
  },

  getProduct: async (id: string): Promise<Product> => {
    const { data } = await client.get(`/products/${id}`);
    return data;
  },

  trackEvent: async (
    userId: string,
    type: string,
    productId: string,
    meta?: unknown,
  ) => {
    await client.post("/events", { userId, type, productId, meta });
  },

  getMetrics: async (): Promise<Metrics> => {
    const { data } = await client.get("/metrics/overview");
    return data;
  },

  getRecentEvents: async (): Promise<Event[]> => {
    const { data } = await client.get("/events/recent");
    return data;
  },

  seed: async () => {
    const { data } = await client.post("/seed");
    return data;
  },

  generateDemoEvents: async (count: number = 50) => {
    const { data } = await client.post(`/events/generate?count=${count}`);
    return data;
  },

  getRecommendations: async (
    productId: string,
    userId?: string,
  ): Promise<{ productId: string; recommendations: Recommendation[] }> => {
    const { data } = await client.get(
      `/recommendations/${productId}?userId=${userId || ""}`,
    );
    return data;
  },

  scoreRisk: async (
    userId: string,
    productId: string,
    amount: number,
  ): Promise<RiskResult> => {
    const { data } = await client.post("/risk/score", {
      userId,
      productId,
      amount,
    });
    return data;
  },

  getTrending: async (
    limit: number = 10,
  ): Promise<{ limit: number; items: TrendingItem[]; source: string }> => {
    const { data } = await client.get(`/trending?limit=${limit}`);
    return data;
  },

  getFraudEvents: async (): Promise<Event[]> => {
    const { data } = await client.get("/events/fraud");
    return data;
  },

  runDemoStory: async (mode: string = "normal"): Promise<unknown> => {
    const { data } = await client.post(`/demo/story?mode=${mode}`, {
      steps: 30,
    });
    return data;
  },

  createCheckoutSession: async (
    userId: string,
    items: { id: string; price: number; quantity: number; name?: string }[],
  ): Promise<CheckoutResponse> => {
    const { data } = await client.post("/checkout/create-session", {
      userId,
      items,
    });
    return data;
  },

  getPaymentStatus: async (): Promise<{ enabled: boolean }> => {
    try {
      const { data } = await client.get("/checkout/status");
      return data;
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
