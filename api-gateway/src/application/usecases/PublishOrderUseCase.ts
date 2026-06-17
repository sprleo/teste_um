import { v4 as uuidv4 } from "uuid";
import type { IMessageBroker } from "../../domain/interfaces/IMessageBroker";
import { calculateTotal, type OrderItem } from "../../domain/entities/Order";
import { QUEUES } from "../../infrastructure/messaging/queues";

export interface PublishOrderInput {
  externalId?: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
}

export interface PublishOrderOutput {
  externalId: string;
  message: string;
}

export class PublishOrderUseCase {
  constructor(private readonly broker: IMessageBroker) {}

  async execute(input: PublishOrderInput): Promise<PublishOrderOutput> {
    const externalId = input.externalId ?? uuidv4();
    const totalAmount = calculateTotal(input.items);

    const payload = {
      externalId,
      customerId: input.customerId,
      customerName: input.customerName,
      items: input.items,
      totalAmount,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };

    await this.broker.publish(QUEUES.ORDERS, payload);

    return { externalId, message: "Order queued for processing" };
  }
}
