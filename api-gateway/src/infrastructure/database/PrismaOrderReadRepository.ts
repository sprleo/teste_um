import { PrismaClient } from "@prisma/client";
import type { IOrderReadRepository, OrderFilters, PaginatedOrders } from "../../domain/interfaces/IOrderReadRepository";
import type { Order, OrderItem } from "../../domain/entities/Order";

export class PrismaOrderReadRepository implements IOrderReadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(filters: OrderFilters): Promise<PaginatedOrders> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.status && { status: filters.status as Order["status"] }),
      ...(filters.customerId && { customerId: filters.customerId }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: rows.map(this.toDomain),
      total,
      page,
      limit,
    };
  }

  async findByExternalId(externalId: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { externalId },
      include: { items: true },
    });

    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: {
    externalId: string;
    customerId: string;
    customerName: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Order {
    return {
      externalId: row.externalId,
      customerId: row.customerId,
      customerName: row.customerName,
      totalAmount: row.totalAmount,
      status: row.status as Order["status"],
      createdAt: row.createdAt,
      items: row.items.map(
        (item): OrderItem => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })
      ),
    };
  }
}
