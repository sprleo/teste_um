import type { Order } from "../domain/Order";
import { StatusBadge } from "./StatusBadge";

interface Props {
  order: Order;
}

export function OrderCard({ order }: Props): JSX.Element {
  const date = new Date(order.createdAt).toLocaleString("pt-BR");

  return (
    <div style={card}>
      <div style={header}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>#{order.externalId.slice(0, 8)}</span>
        <StatusBadge status={order.status} />
      </div>
      <p style={field}>
        <strong>Cliente:</strong> {order.customerName}
      </p>
      <p style={field}>
        <strong>ID cliente:</strong> {order.customerId}
      </p>
      <p style={field}>
        <strong>Total:</strong>{" "}
        {order.totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </p>
      <p style={field}>
        <strong>Itens:</strong> {order.items.length}
      </p>
      <p style={{ ...field, color: "#6b7280", fontSize: 12 }}>{date}</p>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const field: React.CSSProperties = { margin: 0, fontSize: 14 };
