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

// --- NEW SCHEMAS FOR PHASE D3 ---

// Category
export const CategoryCreateSchema = z.object({
  name: z.string().min(1),
});
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
});
export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>;

// Product
export const ProductCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  price: z.number().int().positive(),
  imageUrl: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
});
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;

export const ProductUpdateSchema = ProductCreateSchema.partial();
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;

// User
export const UserCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});
export type UserCreateInput = z.infer<typeof UserCreateSchema>;

export const UserUpdateSchema = UserCreateSchema.partial();
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
