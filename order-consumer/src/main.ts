import "dotenv/config";
import amqplib from "amqplib";
import { PrismaClient } from "@prisma/client";
import { PrismaOrderRepository } from "./infrastructure/database/repositories/PrismaOrderRepository";
import { RabbitMQDeadLetterPublisher } from "./infrastructure/messaging/RabbitMQDeadLetterPublisher";
import { ProcessOrderUseCase } from "./application/usecases/ProcessOrderUseCase";
import { OrderMessageHandler } from "./interface/messaging/OrderMessageHandler";
import { QUEUES, EXCHANGES } from "./infrastructure/messaging/queues";

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

async function setupTopology(channel: amqplib.Channel): Promise<void> {
  await channel.assertExchange(EXCHANGES.ORDERS_DLQ, "direct", { durable: true });
  await channel.assertQueue(QUEUES.ORDERS_DLQ, { durable: true });
  await channel.bindQueue(QUEUES.ORDERS_DLQ, EXCHANGES.ORDERS_DLQ, QUEUES.ORDERS_DLQ);

  await channel.assertExchange(EXCHANGES.ORDERS, "direct", { durable: true });
  await channel.assertQueue(QUEUES.ORDERS, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": EXCHANGES.ORDERS_DLQ,
      "x-dead-letter-routing-key": QUEUES.ORDERS_DLQ,
    },
  });
  await channel.bindQueue(QUEUES.ORDERS, EXCHANGES.ORDERS, QUEUES.ORDERS);
}

async function bootstrap(): Promise<void> {
  const prisma = new PrismaClient();
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await setupTopology(channel);
  channel.prefetch(10);

  const orderRepo = new PrismaOrderRepository(prisma);
  const dlqPublisher = new RabbitMQDeadLetterPublisher(channel);
  const processOrder = new ProcessOrderUseCase(orderRepo, dlqPublisher);
  const handler = new OrderMessageHandler(processOrder, channel);

  await channel.consume(QUEUES.ORDERS, (msg) => {
    if (!msg) return;
    handler.handle(msg).catch((err) => {
      console.error("Unhandled error in message handler:", err);
    });
  });

  console.info("Order consumer started — waiting for messages");

  process.on("SIGTERM", async () => {
    await channel.close();
    await connection.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal error starting order consumer:", err);
  process.exit(1);
});
