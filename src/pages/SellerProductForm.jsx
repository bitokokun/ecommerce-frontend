import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { catalog, seller } from "../api.js";
import { useToast } from "../context/ToastContext.jsx";

export default function SellerProductForm() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    base_price: "",
    status: "draft",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    catalog.categories().then((data) => setCategories(data.results || data));
  }, []);

  useEffect(() => {
    if (isNew) return;
    catalog.detail(id).then((data) => {
      setProduct(data);
      setForm({
        name: data.name,
        category: data.category?.id || "",
        description: data.description,
        base_price: data.base_price,
        status: data.status,
      });
    });
  }, [id, isNew]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isNew) {
        const created = await seller.createProduct(form);
        toast("Product created. Now add at least one variant so it's purchasable.");
        navigate(`/sell/${created.id}`, { replace: true });
      } else {
        await seller.updateProduct(id, form);
        toast("Product updated.");
        const fresh = await catalog.detail(id);
        setProduct(fresh);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isNew && !product) return <div className="container" style={{ padding: "40px 20px" }}>Loading…</div>;

  return (
    <div className="container" style={{ maxWidth: 640, paddingBottom: 80 }}>
      <h1 style={{ fontFamily: "var(--display)", marginTop: 40 }}>
        {isNew ? "New product" : `Edit: ${product.name}`}
      </h1>

      <form className="form" style={{ maxWidth: "100%" }} onSubmit={handleSave}>
        {error && <p className="error-banner">{error}</p>}
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={form.category} onChange={(e) => update("category", e.target.value)}>
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Base price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.base_price}
            onChange={(e) => update("base_price", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="draft">Draft (hidden from the shop)</option>
            <option value="active">Active (visible to shoppers)</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
        </button>
      </form>

      {!isNew && <VariantManager productId={id} product={product} onChange={setProduct} />}
      {!isNew && <ImageManager productId={id} product={product} onChange={setProduct} />}
    </div>
  );
}

function VariantManager({ productId, product, onChange }) {
  const toast = useToast();
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState(1);
  const [busy, setBusy] = useState(false);

  async function addVariant(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await seller.addVariant(productId, { sku, stock: Number(stock), attributes: {} });
      const fresh = await catalog.detail(productId);
      onChange(fresh);
      setSku("");
      setStock(1);
      toast("Variant added.");
    } catch (e2) {
      toast(e2.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function updateStock(variantId, newStock) {
    try {
      await seller.updateVariant(productId, variantId, { stock: Number(newStock) });
      const fresh = await catalog.detail(productId);
      onChange(fresh);
    } catch (e2) {
      toast(e2.message, "error");
    }
  }

  async function removeVariant(variantId) {
    try {
      await seller.deleteVariant(productId, variantId);
      const fresh = await catalog.detail(productId);
      onChange(fresh);
      toast("Variant removed.");
    } catch (e2) {
      toast(e2.message, "error");
    }
  }

  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ fontFamily: "var(--display)", fontSize: "1.3rem" }}>Variants & stock</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
        A product needs at least one variant before shoppers can buy it.
      </p>

      {product.variants.length === 0 ? (
        <p className="error-banner">No variants yet — add one below.</p>
      ) : (
        product.variants.map((v) => (
          <div key={v.id} className="cart-row" style={{ gridTemplateColumns: "1fr auto auto" }}>
            <span className="sku-line">{v.sku}</span>
            <input
              className="qty-input"
              type="number"
              min="0"
              defaultValue={v.stock}
              onBlur={(e) => updateStock(v.id, e.target.value)}
            />
            <button className="btn-danger-link" onClick={() => removeVariant(v.id)}>
              Remove
            </button>
          </div>
        ))
      )}

      <form onSubmit={addVariant} style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <input
          placeholder="SKU, e.g. SHIRT-BLUE-M"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          required
          style={{ flex: "2 1 160px", padding: 10, border: "1px solid var(--line)", borderRadius: 3 }}
        />
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          style={{ flex: "1 1 80px", padding: 10, border: "1px solid var(--line)", borderRadius: 3 }}
        />
        <button className="btn btn-outline" disabled={busy}>
          {busy ? "Adding…" : "Add variant"}
        </button>
      </form>
    </section>
  );
}

function ImageManager({ productId, product, onChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await seller.uploadImage(productId, file);
      const fresh = await catalog.detail(productId);
      onChange(fresh);
      toast("Image uploaded.");
    } catch (e2) {
      toast(e2.message, "error");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ fontFamily: "var(--display)", fontSize: "1.3rem" }}>Photos</h2>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "14px 0" }}>
        {product.images.map((img) => (
          <div key={img.id} className="card-image" style={{ width: 110, height: 110 }}>
            <img src={img.image} alt={img.alt_text || product.name} />
          </div>
        ))}
      </div>
      <label className="btn btn-outline" style={{ display: "inline-flex" }}>
        {busy ? "Uploading…" : "Upload image"}
        <input type="file" accept="image/*" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
      </label>
    </section>
  );
}
