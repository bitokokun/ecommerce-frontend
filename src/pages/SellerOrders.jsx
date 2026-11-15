import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { seller } from "../api.js";
import { useToast } from "../context/ToastContext.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingButton from "../components/LoadingButton.jsx";
import { OrdersSkeleton } from "../components/Skeletons.jsx";
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
      toast.success(status === "shipped" ? "Marked as shipped" : "Marked as delivered");
    } catch (e) {
      toast.error(e.message);
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
        {!allShipped && (
          <LoadingButton className="btn btn-primary" loading={busy} loadingText="Saving…" onClick={() => send("shipped")}>
            Mark shipped
          </LoadingButton>
        )}
        {allShipped && (
          <LoadingButton className="btn btn-saffron" loading={busy} loadingText="Saving…" onClick={() => send("delivered")}>
            Mark delivered
          </LoadingButton>
        )}
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
    <div className="container seller-page seller-orders">
      <Link to="/sell" className="back-link">
        ← Your listings
      </Link>
      <header className="page-head">
        <h1>Orders received</h1>
        <p className="muted">Orders that include your products, with where to ship them.</p>
      </header>

      {loading ? (
        <OrdersSkeleton />
      ) : error ? (
        <EmptyState icon="alert" title="We couldn't load your orders" text={error} action={{ label: "Back to listings", to: "/sell" }} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="orders"
          title="No orders yet"
          text="When someone buys one of your products it shows up here, and a number appears next to Sell at the top."
          action={{ label: "View your listings", to: "/sell" }}
        />
      ) : (
        orders.map((o, i) => (
          <div className={`order-card ${isNew(o) ? "is-new" : ""}`} key={o.id} style={{ "--i": i }}>
            <div className="order-card-header">
              <span>
                Order #{o.id}
                {isNew(o) && <b className="new-tag">NEW</b>}
              </span>
              <span className={`status-pill status-${o.status}`}>{o.status}</span>
            </div>
            <div className="sku-line order-date">{new Date(o.created_at).toLocaleString()}</div>

            {o.items.map((it) => (
              <div key={it.id} className="order-line">
                <span>
                  {it.product_name} × {it.quantity}
                  <span className="sku-line"> {it.sku}</span>
                </span>
                <span className="mono">${it.subtotal}</span>
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

            <div className="order-total">
              <span>Your items total</span>
              <span className="mono">${o.seller_total}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
