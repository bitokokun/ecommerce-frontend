import { useEffect, useState } from "react";
import { catalog } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    setLoading(true);
    catalog
      .list(query)
      .then((data) => setProducts(data.results || data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Everything the stall has, in one aisle.</h1>
          <p>
            Browse goods from independent sellers — search, compare, and check out in one
            place.
          </p>
          <div className="field" style={{ maxWidth: 360, marginTop: 24 }}>
            <input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="container">
        {error && <p className="error-banner">{error}</p>}
        {loading ? (
          <p style={{ padding: "40px 0" }}>Loading products…</p>
        ) : products.length === 0 ? (
          <div className="empty-state">No products match that search yet.</div>
        ) : (
          <div className="grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
