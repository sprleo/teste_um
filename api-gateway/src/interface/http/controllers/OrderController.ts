import type { Request, Response } from "express";
import type { PublishOrderUseCase } from "../../../application/usecases/PublishOrderUseCase";
import type { GetOrdersUseCase, GetOrderByExternalIdUseCase } from "../../../application/usecases/GetOrdersUseCase";
import { createOrderSchema } from "../validators/orderSchema";

export class OrderController {
  constructor(
    private readonly publishOrder: PublishOrderUseCase,
    private readonly getOrders: GetOrdersUseCase,
    private readonly getOrderByExternalId: GetOrderByExternalIdUseCase
  ) {}

  webhook = async (req: Request, res: Response): Promise<void> => {
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const result = await this.publishOrder.execute(parsed.data);
    res.status(202).json(result);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { status, customerId, page, limit } = req.query;

    const result = await this.getOrders.execute({
      status: status as string | undefined,
      customerId: customerId as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json(result);
  };

  show = async (req: Request, res: Response): Promise<void> => {
    const { externalId } = req.params;
    const order = await this.getOrderByExternalId.execute(externalId);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(order);
  };
}
