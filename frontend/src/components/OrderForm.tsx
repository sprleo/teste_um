import { useState } from "react";
import { ordersApi } from "../services/api";
import type { OrderItem } from "../domain/Order";

interface Props {
  onSuccess: () => void;
}

const EMPTY_ITEM: OrderItem = { productId: "", productName: "", quantity: 1, unitPrice: 0 };

export function OrderForm({ onSuccess }: Props): JSX.Element {
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ ...EMPTY_ITEM }]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function updateItem(index: number, field: keyof OrderItem, value: string | number): void {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem(): void {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number): void {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await ordersApi.create({ customerId, customerName, items });
      setFeedback({ type: "success", msg: `Pedido enviado! ID: ${result.externalId}` });
      setCustomerId("");
      setCustomerName("");
      setItems([{ ...EMPTY_ITEM }]);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setFeedback({ type: "error", msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Novo Pedido (Webhook)</h3>

      <label style={labelStyle}>
        ID do cliente
        <input style={inputStyle} value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
      </label>

      <label style={labelStyle}>
        Nome do cliente
        <input style={inputStyle} value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
      </label>

      <div style={{ marginTop: 8 }}>
        <strong style={{ fontSize: 14 }}>Itens</strong>
        {items.map((item, i) => (
          <div key={i} style={itemRow}>
            <input
              placeholder="ID produto"
              style={{ ...inputStyle, flex: 1 }}
              value={item.productId}
              onChange={(e) => updateItem(i, "productId", e.target.value)}
              required
            />
            <input
              placeholder="Nome"
              style={{ ...inputStyle, flex: 2 }}
              value={item.productName}
              onChange={(e) => updateItem(i, "productName", e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Qtd"
              style={{ ...inputStyle, width: 64 }}
              value={item.quantity}
              min={1}
              onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
              required
            />
            <input
              type="number"
              placeholder="Preço"
              style={{ ...inputStyle, width: 90 }}
              value={item.unitPrice}
              min={0.01}
              step={0.01}
              onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
              required
            />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(i)} style={removeBtnStyle}>
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addItem} style={addBtnStyle}>
          + Adicionar item
        </button>
      </div>

      {feedback && (
        <p style={{ color: feedback.type === "success" ? "#10b981" : "#ef4444", fontSize: 13, margin: "8px 0" }}>
          {feedback.msg}
        </p>
      )}

      <button type="submit" disabled={submitting} style={submitStyle}>
        {submitting ? "Enviando..." : "Enviar pedido"}
      </button>
    </form>
  );
}

const formStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  maxWidth: 640,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  fontSize: 13,
  fontWeight: 600,
  gap: 4,
};

const inputStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 13,
};

const itemRow: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  marginTop: 6,
};

const removeBtnStyle: React.CSSProperties = {
  background: "#fee2e2",
  color: "#ef4444",
  border: "none",
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
};

const addBtnStyle: React.CSSProperties = {
  marginTop: 6,
  background: "none",
  border: "1px dashed #9ca3af",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 13,
  cursor: "pointer",
  color: "#6b7280",
};

const submitStyle: React.CSSProperties = {
  marginTop: 4,
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 0",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
