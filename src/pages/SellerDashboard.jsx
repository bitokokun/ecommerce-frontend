import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { seller } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { ListSkeleton } from "../components/Skeletons.jsx";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    seller
      .mine()
      .then((data) => !cancelled && setProducts(data.results || data))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="container seller-page">
      <header className="seller-head">
        <div>
          <h1>Your listings</h1>
          <p className="muted">Selling as {user?.username}</p>
        </div>
        <div className="seller-actions">
          <Link to="/sell/new" className="btn btn-saffron">
            + New product
          </Link>
          <Link to="/sell/orders" className="btn btn-outline">
            Orders received
          </Link>
          <Link to="/sell/store" className="btn btn-outline">
            Store & sales
          </Link>
        </div>
      </header>

      {loading ? (
        <ListSkeleton rows={4} label="Loading your listings" />
      ) : error ? (
        <EmptyState
          icon="alert"
          title="We couldn't load your listings"
          text={error}
          action={{ label: "Try again", onClick: () => setReloadKey((k) => k + 1) }}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon="store"
          title="No listings yet"
          text="Add your first product, then give it a variant with some stock so shoppers can buy it."
          action={{ label: "Add your first product", to: "/sell/new" }}
        />
      ) : (
        <ul className="seller-list">
          {products.map((p, i) => (
            <li key={p.id} style={{ "--i": i }}>
              <Link to={`/sell/${p.id}`} className="seller-row">
                <span className="seller-row-main">
                  <strong>{p.name}</strong>
                  <span className="sku-line">${p.base_price}</span>
                </span>
                <span className={`status-pill status-${p.status}`}>{p.status}</span>
                <svg className="seller-row-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
