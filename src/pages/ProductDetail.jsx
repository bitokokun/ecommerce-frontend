import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { catalog } from "../api.js";
import { useCart } from "../context/CartContext.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    catalog.detail(id).then((data) => {
      setProduct(data);
      if (data.variants?.length) setVariantId(data.variants[0].id);
    });
  }, [id]);

  if (!product) return <div className="container">Loading…</div>;

  const variant = product.variants.find((v) => v.id === Number(variantId));

  async function handleAddToCart() {
    setError("");
    setAdded(false);
    try {
      await addItem(Number(variantId), Number(quantity));
      setAdded(true);
    } catch (e) {
      setError(e.message);
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
            <div className="field" style={{ maxWidth: 260, marginBottom: 16 }}>
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

          {error && <p className="error-banner">{error}</p>}
          {added && <p className="success-banner">Added to cart.</p>}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={!variant?.in_stock}
            >
              {variant?.in_stock ? "Add to cart" : "Out of stock"}
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
