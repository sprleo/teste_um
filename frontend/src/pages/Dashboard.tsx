import { useState } from "react";
import { useQuery } from "react-query";
import { ordersApi } from "../services/api";
import { OrderList } from "../components/OrderList";
import { OrderForm } from "../components/OrderForm";
import type { OrderStatus } from "../domain/Order";

const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Todos", value: "" },
  { label: "Pendente", value: "pending" },
  { label: "Processando", value: "processing" },
  { label: "Concluído", value: "completed" },
  { label: "Falhou", value: "failed" },
];

export function Dashboard(): JSX.Element {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    ["orders", statusFilter, page],
    () => ordersApi.list({ status: statusFilter || undefined, page, limit: 12 }),
    { refetchInterval: 5000 }
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div style={layout}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Order Dashboard</h1>
        <span style={{ color: "#6b7280", fontSize: 14 }}>
          {data ? `${data.total} pedido(s) no total` : ""}
        </span>
      </header>

      <section>
        <OrderForm onSuccess={() => { void refetch(); }} />
      </section>

      <section style={{ marginTop: 24 }}>
        <div style={filterRow}>
          <strong style={{ fontSize: 16 }}>Pedidos</strong>
          <div style={{ display: "flex", gap: 6 }}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value as OrderStatus | ""); setPage(1); }}
                style={{
                  ...filterBtn,
                  background: statusFilter === opt.value ? "#3b82f6" : "#f3f4f6",
                  color: statusFilter === opt.value ? "#fff" : "#374151",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <OrderList
            orders={data?.data ?? []}
            isLoading={isLoading}
            error={error instanceof Error ? error : null}
          />
        </div>

        {totalPages > 1 && (
          <div style={pagination}>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={pageBtn}>
              ← Anterior
            </button>
            <span style={{ fontSize: 13 }}>
              Página {page} / {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={pageBtn}>
              Próxima →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

const layout: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "32px 24px",
  fontFamily: "system-ui, sans-serif",
  color: "#111827",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const filterRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
};

const filterBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 6,
  padding: "5px 12px",
  fontSize: 13,
  cursor: "pointer",
};

const pagination: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 16,
  marginTop: 24,
};

const pageBtn: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 6,
  padding: "6px 14px",
  cursor: "pointer",
  fontSize: 13,
};
