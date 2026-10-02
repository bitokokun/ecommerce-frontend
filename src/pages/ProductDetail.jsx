import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { catalog } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [addedKey, setAddedKey] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    catalog.detail(id).then((data) => {
      setProduct(data);
      if (data.variants?.length) setVariantId(data.variants[0].id);
    });
  }, [id]);

  if (!product) return <div className="container" style={{ padding: "40px 20px" }}>Loading…</div>;

  const variant = product.variants.find((v) => v.id === Number(variantId));

  async function handleAddToCart() {
    setError("");
    // Carts belong to accounts, so ask people to log in first. This avoids the
    // "I added it but checkout says my cart is empty" mix-up.
    if (!user) {
      toast("Log in to add items to your cart.");
      navigate(`/login?next=/products/${id}`);
      return;
    }
    setBusy(true);
    try {
      await addItem(Number(variantId), Number(quantity));
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
            "no image"
          )}
        </div>
        <div>
          <h1>{product.name}</h1>
          <div className="sku-line">{variant?.sku}</div>
          <div className="price-tag">${variant?.price ?? product.base_price}</div>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{product.description}</p>

          {product.variants.length > 1 && (
            <div className="field" style={{ maxWidth: 300, marginBottom: 16 }}>
              <label>Variant</label>
              <select value={variantId ?? ""} onChange={(e) => setVariantId(e.target.value)}>
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.sku} — {JSON.stringify(v.attributes)}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {!variant?.in_stock ? "Out of stock" : busy ? "Adding…" : "Add to cart"}
            </button>
            <button className="btn btn-outline" onClick={() => navigate("/cart")}>
              View cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
