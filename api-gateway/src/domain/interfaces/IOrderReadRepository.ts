import type { Order } from "../entities/Order";

export interface OrderFilters {
  status?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface IOrderReadRepository {
  findAll(filters: OrderFilters): Promise<PaginatedOrders>;
  findByExternalId(externalId: string): Promise<Order | null>;
}
