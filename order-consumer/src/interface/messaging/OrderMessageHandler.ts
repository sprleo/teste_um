import type { ConsumeMessage, Channel } from "amqplib";
import type { ProcessOrderUseCase } from "../../application/usecases/ProcessOrderUseCase";
import type { Order } from "../../domain/entities/Order";

export class OrderMessageHandler {
  constructor(
    private readonly processOrder: ProcessOrderUseCase,
    private readonly channel: Channel
  ) {}

  async handle(msg: ConsumeMessage): Promise<void> {
    let order: Order;

    try {
      order = JSON.parse(msg.content.toString()) as Order;
    } catch {
      console.error("Failed to parse message — sending to DLQ via nack");
      this.channel.nack(msg, false, false);
      return;
    }

    try {
      const result = await this.processOrder.execute(order);

      if (result.success) {
        console.info(`Order ${order.externalId} processed: ${result.reason ?? "ok"}`);
        this.channel.ack(msg);
      } else {
        console.warn(`Order ${order.externalId} rejected: ${result.reason}`);
        this.channel.nack(msg, false, false);
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`Unexpected error processing order ${order.externalId}: ${error}`);
      this.channel.nack(msg, false, false);
    }
  }
}
