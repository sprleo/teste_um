import type { OrderStatus } from "../domain/Order";

const STYLES: Record<OrderStatus, string> = {
  pending: "background:#f59e0b;color:#fff",
  processing: "background:#3b82f6;color:#fff",
  completed: "background:#10b981;color:#fff",
  failed: "background:#ef4444;color:#fff",
};

interface Props {
  status: OrderStatus;
}

export function StatusBadge({ status }: Props): JSX.Element {
  return (
    <span
      style={{
        ...parseStyle(STYLES[status]),
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {status}
    </span>
  );
}

function parseStyle(s: string): React.CSSProperties {
  return Object.fromEntries(
    s.split(";").map((p) => {
      const [k, v] = p.split(":");
      const key = k.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      return [key, v?.trim()];
    })
  ) as React.CSSProperties;
}
