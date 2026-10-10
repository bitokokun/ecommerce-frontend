import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { seller } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    seller
      .mine()
      .then((data) => setProducts(data.results || data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 40,
        }}
      >
        <h1 style={{ fontFamily: "var(--display)", margin: 0 }}>Your listings</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/sell/orders" className="btn btn-outline">
            Orders received
          </Link>
          <Link to="/sell/new" className="btn btn-saffron">
            + New product
          </Link>
        </div>
      </div>
      <p style={{ color: "var(--ink-soft)", marginTop: 6 }}>Selling as {user?.username}.</p>

      {error && <p className="error-banner" style={{ marginTop: 20 }}>{error}</p>}

      {loading ? (
        <p style={{ padding: "30px 0" }}>Loading…</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          No products yet. <Link to="/sell/new">Add your first one.</Link>
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          {products.map((p) => (
            <Link
              key={p.id}
              to={`/sell/${p.id}`}
              className="order-card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}
            >
              <div>
                <strong>{p.name}</strong>
                <div className="sku-line">${p.base_price}</div>
              </div>
              <span className="status-pill">{p.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
