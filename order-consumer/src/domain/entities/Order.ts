export type OrderStatus = "pending" | "processing" | "completed" | "failed";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  externalId: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
}

export function validateOrder(order: Order): string[] {
  const errors: string[] = [];

  if (!order.externalId) errors.push("externalId is required");
  if (!order.customerId) errors.push("customerId is required");
  if (!order.items.length) errors.push("Order must have at least one item");

  for (const item of order.items) {
    if (item.quantity <= 0) errors.push(`Item ${item.productId}: quantity must be positive`);
    if (item.unitPrice <= 0) errors.push(`Item ${item.productId}: unitPrice must be positive`);
  }

  const expectedTotal = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  if (Math.abs(expectedTotal - order.totalAmount) > 0.01) {
    errors.push("totalAmount does not match sum of items");
  }

  return errors;
}
