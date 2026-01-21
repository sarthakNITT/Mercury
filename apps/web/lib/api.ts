const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

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
}

export interface Event {
    id: string;
    type: string;
    product?: Product;
    user?: { name: string };
    createdAt: string;
}

export const api = {
    getProducts: async (): Promise<Product[]> => {
        const res = await fetch(`${API_URL}/products`);
        return res.json();
    },

    getProduct: async (id: string): Promise<Product> => {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        return res.json();
    },

    trackEvent: async (userId: string, type: string, productId: string, meta?: any) => {
        await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const res = await fetch(`${API_URL}/seed`, { method: 'POST' });
        return res.json();
    },

    generateDemoEvents: async (count: number = 50) => {
        const res = await fetch(`${API_URL}/events/generate?count=${count}`, { method: 'POST' });
        return res.json();
    }
};
