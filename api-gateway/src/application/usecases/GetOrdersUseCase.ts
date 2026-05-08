import type { IOrderReadRepository, OrderFilters, PaginatedOrders } from "../../domain/interfaces/IOrderReadRepository";
import type { Order } from "../../domain/entities/Order";

export class GetOrdersUseCase {
  constructor(private readonly repository: IOrderReadRepository) {}

  async execute(filters: OrderFilters): Promise<PaginatedOrders> {
    return this.repository.findAll(filters);
  }
}

export class GetOrderByExternalIdUseCase {
  constructor(private readonly repository: IOrderReadRepository) {}

  async execute(externalId: string): Promise<Order | null> {
    return this.repository.findByExternalId(externalId);
  }
}
