import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { RabbitMQBroker } from "./infrastructure/messaging/RabbitMQBroker";
import { PrismaOrderReadRepository } from "./infrastructure/database/PrismaOrderReadRepository";
import { PublishOrderUseCase } from "./application/usecases/PublishOrderUseCase";
import { GetOrdersUseCase, GetOrderByExternalIdUseCase } from "./application/usecases/GetOrdersUseCase";
import { OrderController } from "./interface/http/controllers/OrderController";
import { orderRoutes } from "./interface/http/routes/orderRoutes";

const PORT = process.env.PORT ?? 3000;
const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

async function bootstrap(): Promise<void> {
  const prisma = new PrismaClient();
  const broker = new RabbitMQBroker(RABBITMQ_URL);

  await broker.connect();
  console.info("Connected to RabbitMQ");

  const orderReadRepo = new PrismaOrderReadRepository(prisma);

  const publishOrder = new PublishOrderUseCase(broker);
  const getOrders = new GetOrdersUseCase(orderReadRepo);
  const getOrderByExternalId = new GetOrderByExternalIdUseCase(orderReadRepo);

  const controller = new OrderController(publishOrder, getOrders, getOrderByExternalId);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api", orderRoutes(controller));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.listen(PORT, () => {
    console.info(`API Gateway running on port ${PORT}`);
  });

  process.on("SIGTERM", async () => {
    await broker.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal error starting API Gateway:", err);
  process.exit(1);
});
