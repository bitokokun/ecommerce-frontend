import { useState } from "react";
import { orders as ordersApi } from "../api.js";
import { useToast } from "../context/ToastContext.jsx";

const STEPS = ["Placed", "Shipped", "Delivered"];

function stepIndex(status) {
  if (status === "delivered") return 2;
  if (status === "shipped") return 1;
  return 0;
}

export default function OrderCard({ order, onChange }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelled = order.status === "cancelled";

  async function cancel() {
    if (!window.confirm(`Cancel order #${order.id}? Items go back into stock.`)) return;
    setBusy(true);
    try {
      onChange?.(await ordersApi.cancel(order.id));
      toast("Order cancelled");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  const fmt = (d) => new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <article className="order-card">
      <div className="order-card-header">
        <span>
          Order #{order.id} · {new Date(order.created_at).toLocaleDateString()}
        </span>
        <span className={`status-pill status-${order.status}`}>{order.status}</span>
      </div>

      {!cancelled && (
        <ol className="tracker" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= stepIndex(order.status) ? "done" : ""}>{s}</li>
          ))}
        </ol>
      )}

      {order.items.map((item) => (
        <div key={item.id} className="order-line">
          <span>
            {item.product_name} × {item.quantity}
            {item.tracking_number && (
              <small className="muted"> · {item.carrier} {item.tracking_number}</small>
            )}
          </span>
          <span className="mono">${item.subtotal}</span>
        </div>
      ))}
      <div className="order-total">
        <span>Total</span>
        <span className="mono">${order.total_amount}</span>
      </div>

      <div className="card-actions">
        <button className="link-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide details" : "Details & tracking"}
        </button>
        {order.can_cancel && (
          <button className="link-btn danger" disabled={busy} onClick={cancel}>
            {busy ? "Cancelling…" : "Cancel order"}
          </button>
        )}
      </div>

      {open && (
        <div className="order-details">
          {order.shipping_to && (
            <p>
              <strong>Ships to</strong>
              <br />
              {order.shipping_to.name}, {order.shipping_to.line1}
              {order.shipping_to.line2 ? `, ${order.shipping_to.line2}` : ""}, {order.shipping_to.postal_code}{" "}
              {order.shipping_to.city}, {order.shipping_to.country}
            </p>
          )}
          <ul className="timeline">
            {order.timeline.map((e) => (
              <li key={e.key}>
                <time>{fmt(e.at)}</time> {e.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
