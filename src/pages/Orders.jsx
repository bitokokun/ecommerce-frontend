import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { orders as ordersApi } from "../api.js";

export default function Orders() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;

  useEffect(() => {
    ordersApi
      .list()
      .then((data) => setList(data.results || data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Loading…</div>;

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <h1 style={{ fontFamily: "var(--display)", marginTop: 40 }}>Your orders</h1>

      {justPlaced && (
        <p className="success-banner" style={{ marginBottom: 20 }}>
          Order #{justPlaced} placed successfully.
        </p>
      )}

      {list.length === 0 ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        list.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-card-header">
              <span>Order #{order.id}</span>
              <span className="status-pill">{order.status}</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span style={{ fontFamily: "var(--mono)" }}>${item.subtotal}</span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid var(--line)",
                fontWeight: 600,
              }}
            >
              <span>Total</span>
              <span style={{ fontFamily: "var(--mono)" }}>${order.total_amount}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
