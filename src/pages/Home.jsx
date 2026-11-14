import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { catalog, recommendations } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const SORTS = [
  ["-created_at", "Newest"],
  ["base_price", "Price: low to high"],
  ["-base_price", "Price: high to low"],
];

const TILE_TONES = ["sage", "peach", "linen"];

function Leaf() {
  return (
    <svg className="stage-leaf" viewBox="0 0 200 260" aria-hidden="true">
      <path d="M100 255C98 190 104 120 140 20" fill="none" stroke="#5f7350" strokeWidth="3" strokeLinecap="round" />
      <path d="M118 110C150 98 172 112 184 136C156 146 130 138 118 110Z" fill="#9caf88" />
      <path d="M108 160C78 150 54 162 42 188C70 198 96 190 108 160Z" fill="#b9c8a8" />
      <path d="M128 62C156 48 176 58 190 80C162 92 138 86 128 62Z" fill="#7f9569" />
      <path d="M112 205C86 200 66 212 58 234C82 240 104 232 112 205Z" fill="#9caf88" />
    </svg>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [everything, setEverything] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [categories, setCategories] = useState([]);
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const shopRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setPicks([]);
      return;
    }
    recommendations
      .forYou()
      .then((d) => setPicks(d.personalized ? d.results : []))
      .catch(() => setPicks([]));
  }, [user?.id]);

  useEffect(() => {
    catalog.categories().then((d) => setCategories(d.results || d)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (ordering !== "-created_at") params.set("ordering", ordering);
    const qs = params.toString();
    setLoading(true);
    setError("");
    const slowTimer = setTimeout(() => setSlow(true), 3500);
    catalog
      .list(qs ? `?${qs}` : "")
      .then((data) => {
        const list = data.results || data;
        setProducts(list);
        if (!search && !category && ordering === "-created_at") setEverything(list);
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        clearTimeout(slowTimer);
        setSlow(false);
        setLoading(false);
      });
    return () => clearTimeout(slowTimer);
  }, [search, category, ordering]);

  const featured = useMemo(() => everything.find((p) => p.primary_image) || null, [everything]);

  const tiles = useMemo(() => {
    const groups = new Map();
    everything.forEach((p) => {
      if (!p.category || !p.category_name) return;
      const g = groups.get(p.category) || { id: p.category, name: p.category_name, count: 0, min: Infinity, image: null };
      g.count += 1;
      g.min = Math.min(g.min, Number(p.base_price));
      if (!g.image && p.primary_image) g.image = p.primary_image;
      groups.set(p.category, g);
    });
    return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 3);
  }, [everything]);

  function goToShop() {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    shopRef.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  }

  function openCategory(id) {
    setCategory(String(id));
    goToShop();
  }

  const filtering = Boolean(search || category);

  return (
    <>
      <section className="stage">
        <div className="stage-frame">
          <div className="stage-title">
            <h1>
              <span className="stage-line">Good things</span>
              <span className="stage-line">found here</span>
            </h1>
            {featured && (
              <Link to={`/products/${featured.id}`} className="stage-feature" aria-label={`Featured: ${featured.name}`}>
                <img src={featured.primary_image} alt="" />
                <span className="stage-badge">New in</span>
                <span className="stage-caption">
                  <span className="stage-name">{featured.name}</span>
                  <b>${featured.base_price}</b>
                </span>
              </Link>
            )}
            <Leaf />
          </div>
          <button type="button" className="pill-cta" onClick={goToShop}>
            Explore the shop
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="stage-bottom">
            <div className="stage-intro">
              <p>Independent sellers, honest prices, one checkout.</p>
              <form
                className="stage-search"
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  goToShop();
                }}
              >
                <input
                  aria-label="Search products"
                  placeholder="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" aria-label="Search">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </form>
            </div>
            {tiles.length > 0 && (
              <div className="tiles">
                {tiles.map((t, i) => (
                  <button
                    type="button"
                    key={t.id}
                    className={`tile tile-${TILE_TONES[i % TILE_TONES.length]}`}
                    onClick={() => openCategory(t.id)}
                  >
                    <span className="tile-text">
                      <strong>{t.name}</strong>
                      <small>from ${Number.isFinite(t.min) ? t.min.toFixed(0) : "–"}</small>
                    </span>
                    {t.image && <img src={t.image} alt="" loading="lazy" />}
                    <span className="tile-arrow" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="shop" id="shop" ref={shopRef}>
        <div className="shop-band">
          <div className="shop-band-inner">
            <div className="shop-top">
              <h2>{filtering ? "Results" : "The shop"}</h2>
              <label className="sortbox">
                <span>Sort</span>
                <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
                  {SORTS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {categories.length > 0 && (
              <div className="chip-row" role="group" aria-label="Filter by category">
                <button className={`pchip ${category === "" ? "on" : ""}`} onClick={() => setCategory("")}>
                  All categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`pchip ${String(c.id) === String(category) ? "on" : ""}`}
                    onClick={() => setCategory(String(c.id))}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="shop-body">
          {picks.length > 0 && !filtering && (
            <div className="shop-block">
              <h3 className="shop-sub">Picked for you</h3>
              <div className="pgrid">
                {picks.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} note={p.reason} />
                ))}
              </div>
              <h3 className="shop-sub">All products</h3>
            </div>
          )}
          {error && <p className="error-banner">{error}</p>}
          {slow && <p className="wake-note">The server was asleep and is waking up. The first load can take up to a minute.</p>}
          {loading ? (
            <div className="pgrid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="pcard pcard-skel" key={i}>
                  <div className="skeleton pcard-skel-img" />
                  <div className="skeleton line" />
                  <div className="skeleton line short" />
                </div>
              ))}
            </div>
          ) : products.length === 0 && !error ? (
            <div className="empty-state">
              {search
                ? `No products match "${search}". Try a shorter word.`
                : category
                ? "Nothing in this category yet."
                : "No products yet. Check back soon."}
            </div>
          ) : (
            <div className="pgrid">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
