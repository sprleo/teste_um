import type { Order, OrderItem, PaginatedOrders } from "../domain/Order";

const BASE = "/api";

export interface OrderFilters {
  status?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const ordersApi = {
  list: (filters: OrderFilters = {}): Promise<PaginatedOrders> => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.customerId) params.set("customerId", filters.customerId);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    return fetchJSON<PaginatedOrders>(`${BASE}/orders?${params}`);
  },

  getByExternalId: (externalId: string): Promise<Order> =>
    fetchJSON<Order>(`${BASE}/orders/${externalId}`),

  create: (payload: {
    externalId?: string;
    customerId: string;
    customerName: string;
    items: OrderItem[];
  }): Promise<{ externalId: string; message: string }> =>
    fetchJSON(`${BASE}/webhook/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};
