import { PrismaClient } from "@prisma/client";
import type { IOrderRepository } from "../../../domain/interfaces/IOrderRepository";
import type { Order, OrderStatus } from "../../../domain/entities/Order";

export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async existsByExternalId(externalId: string): Promise<boolean> {
    const count = await this.prisma.order.count({ where: { externalId } });
    return count > 0;
  }

  async save(order: Order): Promise<void> {
    await this.prisma.order.create({
      data: {
        externalId: order.externalId,
        customerId: order.customerId,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        items: {
          create: order.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
    });
  }

  async updateStatus(externalId: string, status: OrderStatus, errorMessage?: string): Promise<void> {
    await this.prisma.order.update({
      where: { externalId },
      data: { status, errorMessage },
    });
  }
}
