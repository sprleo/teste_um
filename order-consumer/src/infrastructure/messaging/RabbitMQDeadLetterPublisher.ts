import type { Channel } from "amqplib";
import type { IDeadLetterPublisher } from "../../domain/interfaces/IDeadLetterPublisher";
import { EXCHANGES, QUEUES } from "./queues";

export class RabbitMQDeadLetterPublisher implements IDeadLetterPublisher {
  constructor(private readonly channel: Channel) {}

  async publish(message: unknown, reason: string): Promise<void> {
    const payload = { message, reason, failedAt: new Date().toISOString() };
    const content = Buffer.from(JSON.stringify(payload));

    this.channel.publish(EXCHANGES.ORDERS_DLQ, QUEUES.ORDERS_DLQ, content, {
      persistent: true,
      contentType: "application/json",
    });
  }
}
