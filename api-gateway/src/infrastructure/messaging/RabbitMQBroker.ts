import amqplib, { type Channel, type ChannelModel } from "amqplib";
import type { IMessageBroker } from "../../domain/interfaces/IMessageBroker";
import { QUEUES, EXCHANGES } from "./queues";

export class RabbitMQBroker implements IMessageBroker {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly url: string) {}

  async connect(): Promise<void> {
    this.connection = await amqplib.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.setupTopology();
  }

  private async setupTopology(): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    await this.channel.assertExchange(EXCHANGES.ORDERS_DLQ, "direct", { durable: true });
    await this.channel.assertQueue(QUEUES.ORDERS_DLQ, { durable: true });
    await this.channel.bindQueue(QUEUES.ORDERS_DLQ, EXCHANGES.ORDERS_DLQ, QUEUES.ORDERS_DLQ);

    await this.channel.assertExchange(EXCHANGES.ORDERS, "direct", { durable: true });
    await this.channel.assertQueue(QUEUES.ORDERS, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGES.ORDERS_DLQ,
        "x-dead-letter-routing-key": QUEUES.ORDERS_DLQ,
      },
    });
    await this.channel.bindQueue(QUEUES.ORDERS, EXCHANGES.ORDERS, QUEUES.ORDERS);
  }

  async publish(queue: string, message: unknown): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");

    const content = Buffer.from(JSON.stringify(message));
    this.channel.publish(EXCHANGES.ORDERS, queue, content, {
      persistent: true,
      contentType: "application/json",
    });
  }

  async disconnect(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
