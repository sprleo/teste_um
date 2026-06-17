import type { Order, OrderStatus } from "../entities/Order";

export interface IOrderRepository {
  existsByExternalId(externalId: string): Promise<boolean>;
  save(order: Order): Promise<void>;
  updateStatus(externalId: string, status: OrderStatus, errorMessage?: string): Promise<void>;
}
