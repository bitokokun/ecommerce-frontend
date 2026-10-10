import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { seller } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getSeen, setSeen } from "../salesSeen.js";

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [seenBefore, setSeenBefore] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // remember what was already seen BEFORE this visit, so the orders that were
    // new can still be highlighted below even though the badge clears now
    setSeenBefore(getSeen(user.id));
    seller
      .received()
      .then((data) => {
        const list = data.results || data;
        setOrders(list);
        if (list.length) setSeen(user.id, list[0].created_at); // newest first
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
