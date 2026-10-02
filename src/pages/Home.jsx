import { useEffect, useState } from "react";
import { catalog } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";

const HEADLINE = "Everything the stall has, in one aisle.".split(" ");
const RIBBON = [
  "Fresh stock daily",
  "Independent sellers",
  "One-tap checkout",
  "Stock locked at purchase",
  "Fresh stock daily",
  "Independent sellers",
  "One-tap checkout",
  "Stock locked at purchase",
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    setLoading(true);
    setError("");
    // the free server sleeps when idle; tell people why the first load is slow
    const slowTimer = setTimeout(() => setSlow(true), 3500);
    catalog
      .list(query)
      .then((data) => setProducts(data.results || data))
      .catch((e) => setError(e.message))
      .finally(() => {
        clearTimeout(slowTimer);
        setSlow(false);
        setLoading(false);
      });
    return () => clearTimeout(slowTimer);
  }, [search]);

  return (
    <>
      <section className="hero">
        <div className="awning" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="tags" aria-hidden="true">
            <div className="tag" style={{ "--d": "0s" }}>$19</div>
            <div className="tag" style={{ "--d": "-1.1s" }}>new</div>
            <div className="tag" style={{ "--d": "-2.2s" }}>sale</div>
          </div>
          <h1 aria-label="Everything the stall has, in one aisle.">
            {HEADLINE.map((w, i) => (
              <span className="word" style={{ "--i": i }} key={i} aria-hidden="true">
                {w}
              </span>
            ))}
          </h1>
          <p>
            Browse goods from independent sellers. Search, compare, and check out in one place.
          </p>
          <div className="hero-search">
            <input
              aria-label="Search products"
              placeholder="Search products…"
              value={search}
              onChange={(e) => {
                setSearched(true);
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>
      </section>

      <div className="ribbon" aria-hidden="true">
        <div className="ribbon-track">
          {RIBBON.concat(RIBBON).map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      <div className="container">
        {error && <p className="error-banner" style={{ marginTop: 24 }}>{error}</p>}
        {slow && (
          <p className="wake-note">
            The server was asleep and is waking up. The first load can take up to a minute.
          </p>
        )}
        {loading ? (
          <div className="grid no-intro">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="card skel" key={i}>
                <div className="skeleton img" />
                <div className="skeleton line" />
                <div className="skeleton line short" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            {search ? `No products match "${search}". Try a shorter word.` : "No products yet. Check back soon."}
          </div>
        ) : (
          <div className={`grid ${searched ? "no-intro" : ""}`}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
