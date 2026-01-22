export interface RecoWeights {
  categoryBoost: number;
  trendingWeights: {
    VIEW: number;
    CLICK: number;
    CART: number;
    PURCHASE: number;
  };
  affinityBoost: number;
}

export const DEFAULT_WEIGHTS: RecoWeights = {
  categoryBoost: 0, // Logic.ts uses hardcoded 0/1 multiplier implies handled logic side?
  // Actually the logic.ts had hardcoded logic inside the map function.
  // We need to inject weights there.
  trendingWeights: { VIEW: 0.2, CLICK: 0.6, CART: 2.0, PURCHASE: 5.0 },
  affinityBoost: 0, // Logic currently just uses 0/1.
};
