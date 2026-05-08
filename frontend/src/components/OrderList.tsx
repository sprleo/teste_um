import type { Order } from "../domain/Order";
import { OrderCard } from "./OrderCard";

interface Props {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
}

export function OrderList({ orders, isLoading, error }: Props): JSX.Element {
  if (isLoading) return <p style={{ color: "#6b7280" }}>Carregando pedidos...</p>;
  if (error) return <p style={{ color: "#ef4444" }}>Erro: {error.message}</p>;
  if (!orders.length) return <p style={{ color: "#6b7280" }}>Nenhum pedido encontrado.</p>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      {orders.map((o) => (
        <OrderCard key={o.externalId} order={o} />
      ))}
    </div>
  );
}
