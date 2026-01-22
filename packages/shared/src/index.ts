import { z } from "zod";

export const EventTypeSchema = z.enum(["VIEW", "CLICK", "CART", "PURCHASE"]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const EventBodySchema = z.object({
  userId: z.string(),
  productId: z.string(),
  type: EventTypeSchema,
  meta: z.object({}).passthrough().optional(), // Allow any JSON object
});
export type EventBody = z.infer<typeof EventBodySchema>;

export const ProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number().int().positive(),
  currency: z.string().default("INR"),
  category: z.string(),
  imageUrl: z.string().optional(),
});
export type ProductInput = z.infer<typeof ProductSchema>;

export const RiskScoreSchema = z.object({
  userId: z.string(),
  productId: z.string().optional(),
  amount: z.number(),
});
export type RiskScoreInput = z.infer<typeof RiskScoreSchema>;

export const CheckoutItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().optional(),
});

export const CheckoutSessionSchema = z.object({
  items: z.array(CheckoutItemSchema),
  userId: z.string().optional(),
});
export type CheckoutSessionInput = z.infer<typeof CheckoutSessionSchema>;
