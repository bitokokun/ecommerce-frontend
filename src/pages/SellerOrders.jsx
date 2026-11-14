import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { seller } from "../api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getSeen, setSeen } from "../salesSeen.js";

function FulfilForm({ order, onUpdated }) {
  const toast = useToast();
  const mine = order.items;
  const allDelivered = mine.every((i) => i.fulfilment_status === "delivered");
  const allShipped = mine.every((i) => i.fulfilment_status !== "pending");
  const [carrier, setCarrier] = useState(mine.find((i) => i.carrier)?.carrier || "");
  const [tracking, setTracking] = useState(mine.find((i) => i.tracking_number)?.tracking_number || "");
  const [busy, setBusy] = useState(false);

  if (order.status === "cancelled")
    return <p className="muted" style={{ marginTop: 12 }}>This order was cancelled by the buyer. Do not ship it.</p>;
  if (allDelivered) return <p className="muted" style={{ marginTop: 12 }}>All your items are delivered.</p>;

  async function send(status) {
    setBusy(true);
    try {
      onUpdated(await seller.fulfil(order.id, { status, carrier, tracking_number: tracking }));
      toast(status === "shipped" ? "Marked as shipped" : "Marked as delivered");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fulfil-box">
      {!allShipped && (
        <div className="form-grid">
          <label className="field"><span>Carrier</span><input value={carrier} maxLength={60} onChange={(e) => setCarrier(e.target.value)} placeholder="DHL, CTT…" /></label>
          <label className="field"><span>Tracking number</span><input value={tracking} maxLength={100} onChange={(e) => setTracking(e.target.value)} /></label>
        </div>
      )}
      <div className="action-row">
        {!allShipped && <button className="btn btn-primary" disabled={busy} onClick={() => send("shipped")}>Mark shipped</button>}
        {allShipped && <button className="btn btn-saffron" disabled={busy} onClick={() => send("delivered")}>Mark delivered</button>}
      </div>
    </div>
  );
}

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [seenBefore, setSeenBefore] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSeenBefore(getSeen(user.id));
    seller
      .received()
      .then((data) => {
        const list = data.results || data;
        setOrders(list);
        if (list.length) setSeen(user.id, list[0].created_at);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  const isNew = (o) => !seenBefore || new Date(o.created_at) > new Date(seenBefore);

  return (
    <div className="container" style={{ paddingBottom: 80, maxWidth: 760 }}>
      <Link to="/sell" className="sku-line" style={{ display: "inline-block", marginTop: 32 }}>
        ← Your listings
      </Link>
      <h1 style={{ fontFamily: "var(--display)", margin: "8px 0 4px" }}>Orders received</h1>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        Orders that include your products, with where to ship them.
      </p>

      {error && <p className="error-banner">{error}</p>}
      {loading ? (
        <p style={{ padding: "30px 0" }}>Loading…</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          No orders yet. When someone buys one of your products it shows up here, and a number
          appears next to “Sell” at the top.
        </div>
      ) : (
        orders.map((o, i) => (
          <div className={`order-card ${isNew(o) ? "is-new" : ""}`} key={o.id} style={{ "--i": i }}>
            <div className="order-card-header">
              <span>
                Order #{o.id}
                {isNew(o) && <b className="new-tag">NEW</b>}
              </span>
              <span className="status-pill">{o.status}</span>
            </div>
            <div className="sku-line" style={{ marginBottom: 8 }}>
              {new Date(o.created_at).toLocaleString()}
            </div>

            {o.items.map((it) => (
              <div
                key={it.id}
                style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0" }}
              >
                <span>
                  {it.product_name} × {it.quantity}
                  <span className="sku-line"> {it.sku}</span>
                </span>
                <span style={{ fontFamily: "var(--mono)" }}>${it.subtotal}</span>
              </div>
            ))}

            <div className="ship-to">
              <div className="sku-line">SHIP TO</div>
              <div>{o.ship_to.name}</div>
              <div>
                {o.ship_to.line1}
                {o.ship_to.line2 ? `, ${o.ship_to.line2}` : ""}
              </div>
              <div>
                {o.ship_to.city}
                {o.ship_to.state ? `, ${o.ship_to.state}` : ""} {o.ship_to.postal_code}
              </div>
              <div>{o.ship_to.country}</div>
            </div>

            <FulfilForm order={o} onUpdated={(n) => setOrders((l) => l.map((x) => (x.id === n.id ? n : x)))} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
                paddingTop: 10,
                borderTop: "1px solid var(--line)",
                fontWeight: 600,
              }}
            >
              <span>Your items total</span>
              <span style={{ fontFamily: "var(--mono)" }}>${o.seller_total}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
