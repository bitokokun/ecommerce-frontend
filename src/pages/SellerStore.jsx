import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { seller } from "../api.js";
import { useToast } from "../context/ToastContext.jsx";

export default function SellerStore() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [store, setStore] = useState(null);
  const [form, setForm] = useState(null);
  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    seller
      .store()
      .then((s) => {
        setStore(s);
        setForm({
          store_name: s.store_name,
          description: s.description || "",
          contact_email: s.contact_email || "",
          shipping_note: s.shipping_note || "",
          return_policy: s.return_policy || "",
        });
      })
      .catch((e) => setLoadError(e.message));
    seller.stats().then(setStats).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      setStore(await seller.updateStore(form));
      toast("Store saved");
    } catch (err) {
      setErrors(err.data && typeof err.data === "object" ? err.data : { detail: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function onLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setStore(await seller.uploadLogo(file));
      toast("Logo updated");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  if (loadError) return <div className="container"><p className="error-banner" style={{ marginTop: 40 }}>{loadError}</p></div>;
  if (!form) return <div className="container" style={{ padding: "40px 20px" }}>Loading…</div>;

  const field = (k, label, props = {}) => (
    <label className="field">
      <span>{label}</span>
      <input value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <small className="field-error">{[].concat(errors[k]).join(" ")}</small>}
    </label>
  );

  return (
    <div className="container account" style={{ paddingBottom: 80 }}>
      <Link to="/sell" className="sku-line" style={{ display: "inline-block", marginTop: 32 }}>← Your listings</Link>
      <h1 className="page-title">Store & sales</h1>

      {stats && (
        <>
          <div className="stat-row">
            <div className="stat"><strong>${stats.revenue}</strong><span>Revenue</span></div>
            <div className="stat"><strong>{stats.orders}</strong><span>Orders</span></div>
            <div className="stat"><strong>{stats.units_sold}</strong><span>Units sold</span></div>
            <Link to="/sell/orders" className="stat"><strong>{stats.orders_to_ship}</strong><span>To ship</span></Link>
          </div>
          <p className="muted">Last 30 days: ${stats.revenue_30d} from {stats.orders_30d} order(s). Cancelled orders are excluded.</p>
          <div className="two-col">
            <div className="form-card">
              <h2 className="section-title">Best sellers</h2>
              {stats.top_products.length === 0 ? <p className="muted">No sales yet.</p> : (
                <ol className="rank-list">
                  {stats.top_products.map((p) => (
                    <li key={p.product_id}><Link to={`/sell/${p.product_id}`}>{p.name}</Link><span className="mono">${p.revenue} · {p.units} sold</span></li>
                  ))}
                </ol>
              )}
            </div>
            <div className="form-card">
              <h2 className="section-title">Low stock</h2>
              {stats.low_stock.length === 0 ? <p className="muted">Everything is well stocked.</p> : (
                <ul className="rank-list">
                  {stats.low_stock.map((v) => (
                    <li key={v.sku}><Link to={`/sell/${v.product_id}`}>{v.product} <small>({v.sku})</small></Link><span className={`mono ${v.stock === 0 ? "danger-text" : ""}`}>{v.stock} left</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <h2 className="section-title" style={{ marginTop: 40 }}>Store profile</h2>
      <div className="two-col">
        <div className="photo-card">
          {store.logo_url ? <img className="avatar" style={{ width: 120, height: 120 }} src={store.logo_url} alt={`${store.store_name} logo`} /> : <span className="avatar avatar-fallback" style={{ width: 120, height: 120, fontSize: 48 }}>{store.store_name.charAt(0).toUpperCase()}</span>}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onLogo} />
          <div className="photo-actions">
            <button className="btn btn-outline" onClick={() => fileRef.current?.click()}>{store.logo_url ? "Replace logo" : "Upload logo"}</button>
            {store.logo_url && (
              <button className="btn-danger-link" onClick={async () => { try { setStore(await seller.removeLogo()); } catch (e) { toast(e.message, "error"); } }}>Remove logo</button>
            )}
          </div>
          <small className="muted">JPEG, PNG or WebP, up to 2MB.</small>
        </div>
        <form onSubmit={save} className="form-card" noValidate>
          {errors.detail && <p className="error-banner">{errors.detail}</p>}
          {field("store_name", "Store name", { required: true, maxLength: 80 })}
          <label className="field">
            <span>Description</span>
            <textarea rows={4} maxLength={1000} value={form.description} onChange={set("description")} />
          </label>
          {field("contact_email", "Contact email", { type: "email" })}
          {field("shipping_note", "Shipping note", { maxLength: 255, placeholder: "Ships within 2 business days" })}
          {field("return_policy", "Return policy", { maxLength: 500 })}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save store"}</button>
        </form>
      </div>
    </div>
  );
}
