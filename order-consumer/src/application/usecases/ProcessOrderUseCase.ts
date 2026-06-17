import type { IOrderRepository } from "../../domain/interfaces/IOrderRepository";
import type { IDeadLetterPublisher } from "../../domain/interfaces/IDeadLetterPublisher";
import { validateOrder, type Order } from "../../domain/entities/Order";

export interface ProcessOrderResult {
  success: boolean;
  reason?: string;
}

export class ProcessOrderUseCase {
  constructor(
    private readonly repository: IOrderRepository,
    private readonly dlqPublisher: IDeadLetterPublisher
  ) {}

  async execute(order: Order): Promise<ProcessOrderResult> {
    const alreadyExists = await this.repository.existsByExternalId(order.externalId);
    if (alreadyExists) {
      return { success: true, reason: "duplicate — skipped (idempotent)" };
    }

    const validationErrors = validateOrder(order);
    if (validationErrors.length > 0) {
      const reason = validationErrors.join("; ");
      await this.dlqPublisher.publish(order, reason);
      return { success: false, reason };
    }

    await this.repository.save({ ...order, status: "processing" });

    await this.applyBusinessRules(order);

    await this.repository.updateStatus(order.externalId, "completed");

    return { success: true };
  }

  private async applyBusinessRules(order: Order): Promise<void> {
    if (order.totalAmount > 100_000) {
      throw new Error("Order exceeds maximum allowed amount of 100,000");
    }

    if (order.items.length > 50) {
      throw new Error("Order cannot have more than 50 items");
    }
  }
}
