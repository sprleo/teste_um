import { Router } from "express";
import type { OrderController } from "../controllers/OrderController";

export function orderRoutes(controller: OrderController): Router {
  const router = Router();

  router.post("/webhook/orders", controller.webhook);
  router.get("/orders", controller.list);
  router.get("/orders/:externalId", controller.show);

  return router;
}
