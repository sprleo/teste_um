export const QUEUES = {
  ORDERS: "orders.queue",
  ORDERS_DLQ: "orders.dlq",
} as const;

export const EXCHANGES = {
  ORDERS: "orders.exchange",
  ORDERS_DLQ: "orders.dlq.exchange",
} as const;
