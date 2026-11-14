import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { catalog, recommendations } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ProductCard from "../components/ProductCard.jsx";
import WishButton from "../components/WishButton.jsx";
import Placeholder from "../components/Placeholder.jsx";
import VariantPicker from "../components/VariantPicker.jsx";
import { findVariant, initialSelection, optionKeys } from "../variants.js";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [selection, setSelection] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [addedKey, setAddedKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    catalog.detail(id).then((data) => {
      setProduct(data);
      if (data.variants?.length) {
        setVariantId((data.variants.find((v) => v.in_stock) || data.variants[0]).id);
        setSelection(initialSelection(data.variants));
      }
    });
  }, [id]);

  useEffect(() => {
    setSimilar([]);
    recommendations
      .similar(id)
      .then((d) => setSimilar(d.results || []))
      .catch(() => {});
  }, [id]);

  if (!product) return <div className="container" style={{ padding: "40px 20px" }}>Loading…</div>;

  const hasOptions = optionKeys(product.variants).length > 0;
  const variant = hasOptions
    ? findVariant(product.variants, selection)
    : product.variants.find((v) => v.id === Number(variantId));

  async function handleAddToCart() {
    setError("");
    if (!user) {
      toast("Log in to add items to your cart.");
      navigate(`/login?next=/products/${id}`);
      return;
    }
    setBusy(true);
    try {
      await addItem(variant.id, Number(quantity));
      setAddedKey((k) => k + 1);
      toast(`${product.name} added to your cart.`);
    } catch (e) {
      setError(e.message);
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="product-detail">
        <div className="product-detail-image">
          {product.images?.[0] ? (
            <img src={product.images[0].image} alt={product.name} />
          ) : (
            <Placeholder name={product.name} />
          )}
        </div>
        <div>
          <h1>{product.name}</h1>
          <div className="sku-line">{variant?.sku}</div>
          <div className="price-tag">${variant?.price ?? product.base_price}</div>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{product.description}</p>

          <VariantPicker
            variants={product.variants}
            selection={selection}
            variant={variant}
            onSelect={(key, val) => {
              setSelection((sel) => ({ ...sel, [key]: val }));
              setQuantity(1);
            }}
            variantId={variantId}
            onSelectId={(id) => {
              setVariantId(id);
              setQuantity(1);
            }}
          />

          <div className="field" style={{ maxWidth: 120, marginBottom: 20 }}>
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              max={variant?.stock ?? 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {error && <p className="error-banner" style={{ marginBottom: 14 }}>{error}</p>}
          {addedKey > 0 && (
            <div key={addedKey} className="added-stamp">
              Added to cart
            </div>
          )}

          <div className="action-row">
            <button
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={!variant?.in_stock || busy}
            >
              {!variant ? "Not available" : !variant.in_stock ? "Sold out" : busy ? "Adding…" : "Add to cart"}
            </button>
            <button className="btn btn-outline" onClick={() => navigate("/cart")}>
              View cart
            </button>
            {product && <WishButton productId={product.id} className="wish-inline" />}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="rec-section">
          <h2>You might also like</h2>
          <div className="grid no-intro">
            {similar.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} note={p.reason} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
