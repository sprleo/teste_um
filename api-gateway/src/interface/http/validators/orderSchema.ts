import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const createOrderSchema = z.object({
  externalId: z.string().uuid().optional(),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
