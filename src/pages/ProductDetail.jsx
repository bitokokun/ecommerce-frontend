import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { catalog, recommendations } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingButton from "../components/LoadingButton.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { ProductDetailSkeleton } from "../components/Skeletons.jsx";
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
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setProduct(null);
    setLoadError(null);
    setQuantity(1);
    setError("");
    catalog
      .detail(id)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        if (data.variants?.length) {
          setVariantId((data.variants.find((v) => v.in_stock) || data.variants[0]).id);
          setSelection(initialSelection(data.variants));
        }
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  useEffect(() => {
    setSimilar([]);
    recommendations
      .similar(id)
      .then((d) => setSimilar(d.results || []))
      .catch(() => {});
  }, [id]);

  if (loadError) {
    const missing = loadError.status === 404;
    return (
      <div className="container">
        <EmptyState
          icon={missing ? "search" : "alert"}
          title={missing ? "We couldn't find that product" : "We couldn't load this product"}
          text={missing ? "It may have been removed or is no longer available." : loadError.message}
          action={{ label: "Continue shopping", to: "/" }}
          secondary={missing ? undefined : { label: "Try again", onClick: () => setReloadKey((k) => k + 1) }}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <ProductDetailSkeleton />
      </div>
    );
  }

  const hasOptions = optionKeys(product.variants).length > 0;
  const variant = hasOptions
    ? findVariant(product.variants, selection)
    : product.variants.find((v) => v.id === Number(variantId));

  async function handleAddToCart() {
    setError("");
    if (!user) {
      toast.info("Log in to add items to your cart.");
      navigate(`/login?next=/products/${id}`);
      return;
    }
    setBusy(true);
    try {
      await addItem(variant.id, Number(quantity));
      setAddedKey((k) => k + 1);
      toast.success(`${product.name} added to your cart.`);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
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
        <div className="product-info">
          <h1>{product.name}</h1>
          <div className="sku-line">{variant?.sku}</div>
          <div className="price-tag">${variant?.price ?? product.base_price}</div>
          {product.description && <p className="product-desc">{product.description}</p>}

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

          <div className="field quantity-field">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              min="1"
              max={variant?.stock ?? 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
          {addedKey > 0 && (
            <div key={addedKey} className="added-stamp">
              Added to cart
            </div>
          )}

          <div className="action-row">
            <LoadingButton
              className="btn btn-primary"
              onClick={handleAddToCart}
              loading={busy}
              loadingText="Adding…"
              disabled={!variant?.in_stock}
            >
              {!variant ? "Not available" : !variant.in_stock ? "Sold out" : "Add to cart"}
            </LoadingButton>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/cart")}>
              View cart
            </button>
            {product && <WishButton productId={product.id} className="wish-inline" />}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="rec-section">
          <h2>You might also like</h2>
          <div className="pgrid">
            {similar.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} note={p.reason} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
