import { useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, useNavigate, useParams } from "react-router-dom";
import { accounts, orders as ordersApi, profile as profileApi, wishlist as wishApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "../components/Avatar.jsx";
import ProductCard from "../components/ProductCard.jsx";
import OrderCard from "../components/OrderCard.jsx";

const TABS = [
  ["overview", "Overview"],
  ["profile", "Profile"],
  ["addresses", "Addresses"],
  ["orders", "Orders"],
  ["wishlist", "Wishlist"],
  ["security", "Security"],
  ["preferences", "Preferences"],
];

export default function Account() {
  const { user, loading, logout } = useAuth();
  const { tab = "overview" } = useParams();
  const navigate = useNavigate();

  if (loading) return <div className="container" style={{ padding: "40px 20px" }}>Loading…</div>;
  if (!user) return <Navigate to="/login?next=/account" replace />;
  if (!TABS.some(([k]) => k === tab)) return <Navigate to="/account" replace />;

  return (
    <div className="container account">
      <header className="account-head">
        <Avatar user={user} size={72} />
        <div>
          <p className="eyebrow">My account</p>
          <h1>{user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username}</h1>
          <p className="muted">@{user.username} · {user.email || "no email on file"}</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Log out
        </button>
      </header>

      <nav className="account-tabs" aria-label="Account sections">
        {TABS.map(([key, label]) => (
          <NavLink key={key} to={key === "overview" ? "/account" : `/account/${key}`} end className={() => (tab === key ? "active" : "")}>
            {label}
          </NavLink>
        ))}
      </nav>

      <section className="account-body" key={tab}>
        {tab === "overview" && <Overview />}
        {tab === "profile" && <ProfileTab />}
        {tab === "addresses" && <AddressesTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "wishlist" && <WishlistTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "preferences" && <PreferencesTab />}
      </section>
    </div>
  );
}

function Overview() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([ordersApi.list(), wishApi.ids()])
      .then(([o, w]) => {
        setOrders(o.results || o);
        setSaved(w.length);
      })
      .catch((e) => setError(e.message));
  }, []);

  const open = orders ? orders.filter((o) => ["pending", "paid", "shipped"].includes(o.status)).length : null;
  const stat = (n, label, to) => (
    <Link to={to} className="stat">
      <strong>{n ?? "–"}</strong>
      <span>{label}</span>
    </Link>
  );
  return (
    <>
      {error && <p className="error-banner">{error}</p>}
      <div className="stat-row">
        {stat(orders?.length, "Orders placed", "/account/orders")}
        {stat(open, "In progress", "/account/orders")}
        {stat(saved, "Saved items", "/account/wishlist")}
      </div>
      <p className="muted" style={{ marginTop: 24 }}>
        Member since {new Date(user.date_joined).toLocaleDateString(undefined, { year: "numeric", month: "long" })}.
      </p>
      {orders && orders[0] && (
        <>
          <h2 className="section-title">Latest order</h2>
          <OrderCard order={orders[0]} onChange={(o) => setOrders((l) => l.map((x) => (x.id === o.id ? o : x)))} />
        </>
      )}
    </>
  );
}

function ProfileTab() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    username: user.username,
    email: user.email || "",
    phone_number: user.phone_number || "",
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      setUser(await profileApi.update(form));
      toast("Profile saved");
    } catch (err) {
      setErrors(err.data && typeof err.data === "object" ? err.data : { detail: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast("Choose an image under 2MB", "error");
    setPhotoBusy(true);
    try {
      setUser(await profileApi.uploadAvatar(file));
      toast("Profile picture updated");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    try {
      setUser(await profileApi.removeAvatar());
      toast("Profile picture removed");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setPhotoBusy(false);
    }
  }

  const field = (key, label, type = "text", extra = {}) => (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={form[key]} onChange={set(key)} aria-invalid={!!errors[key]} {...extra} />
      {errors[key] && <small className="field-error">{[].concat(errors[key]).join(" ")}</small>}
    </label>
  );

  return (
    <div className="two-col">
      <div className="photo-card">
        <Avatar user={user} size={120} />
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onPhoto} />
        <div className="photo-actions">
          <button className="btn btn-outline" disabled={photoBusy} onClick={() => fileRef.current?.click()}>
            {photoBusy ? "Working…" : user.avatar_url ? "Replace photo" : "Upload photo"}
          </button>
          {user.avatar_url && (
            <button className="btn-danger-link" disabled={photoBusy} onClick={removePhoto}>
              Remove photo
            </button>
          )}
        </div>
        <small className="muted">JPEG, PNG or WebP, up to 2MB.</small>
      </div>

      <form onSubmit={save} className="form-card" noValidate>
        {errors.detail && <p className="error-banner">{errors.detail}</p>}
        <div className="form-grid">
          {field("first_name", "First name", "text", { autoComplete: "given-name", maxLength: 150 })}
          {field("last_name", "Last name", "text", { autoComplete: "family-name", maxLength: 150 })}
        </div>
        {field("username", "Username", "text", { autoComplete: "username", required: true })}
        {field("email", "Email", "email", { autoComplete: "email", required: true })}
        {field("phone_number", "Phone number", "tel", { autoComplete: "tel", placeholder: "+351 912 345 678" })}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}

const EMPTY_ADDR = { full_name: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "", phone_number: "", is_default: false };

function AddressesTab() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [countries, setCountries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    ordersApi.addresses
      .list()
      .then((d) => setList(d.results || d))
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
    accounts.countries().then(setCountries).catch(() => {});
  }, []);

  async function remove(a) {
    if (!window.confirm(`Delete the address for ${a.full_name}?`)) return;
    try {
      await ordersApi.addresses.remove(a.id);
      toast("Address deleted");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function makeDefault(a) {
    try {
      await ordersApi.addresses.update(a.id, { is_default: true });
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  if (editing)
    return (
      <AddressForm
        initial={editing === "new" ? EMPTY_ADDR : editing}
        countries={countries}
        onDone={(saved) => {
          setEditing(null);
          if (saved) load();
        }}
      />
    );

  return (
    <>
      {error && <p className="error-banner">{error}</p>}
      <div className="section-bar">
        <h2 className="section-title">Saved addresses</h2>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          + Add address
        </button>
      </div>
      {!list ? (
        <p>Loading…</p>
      ) : list.length === 0 ? (
        <div className="empty-state">No addresses yet. Add one to check out faster.</div>
      ) : (
        <div className="address-grid">
          {list.map((a) => (
            <article key={a.id} className={`address-card ${a.is_default ? "is-default" : ""}`}>
              {a.is_default && <span className="status-pill">Default</span>}
              <strong>{a.full_name}</strong>
              <p>
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.postal_code} {a.city}
                {a.state ? `, ${a.state}` : ""}
                <br />
                {a.country}
              </p>
              {a.phone_number && <p className="muted">{a.phone_number}</p>}
              <div className="card-actions">
                <button className="link-btn" onClick={() => setEditing(a)}>Edit</button>
                {!a.is_default && <button className="link-btn" onClick={() => makeDefault(a)}>Make default</button>}
                <button className="link-btn danger" onClick={() => remove(a)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function AddressForm({ initial, countries, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ ...EMPTY_ADDR, ...initial });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = { ...form };
    delete payload.id;
    delete payload.user;
    try {
      form.id ? await ordersApi.addresses.update(form.id, payload) : await ordersApi.addresses.create(payload);
      toast("Address saved");
      onDone(true);
    } catch (err) {
      setErrors(err.data && typeof err.data === "object" ? err.data : { detail: err.message });
    } finally {
      setBusy(false);
    }
  }

  const input = (k, label, props = {}) => (
    <label className="field">
      <span>{label}</span>
      <input value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <small className="field-error">{[].concat(errors[k]).join(" ")}</small>}
    </label>
  );

  return (
    <form onSubmit={submit} className="form-card" noValidate>
      <h2 className="section-title">{form.id ? "Edit address" : "New address"}</h2>
      {errors.detail && <p className="error-banner">{errors.detail}</p>}
      {input("full_name", "Full name", { required: true, autoComplete: "name" })}
      {input("line1", "Address line 1", { required: true, autoComplete: "address-line1" })}
      {input("line2", "Address line 2", { autoComplete: "address-line2" })}
      <div className="form-grid">
        {input("city", "City", { required: true, autoComplete: "address-level2" })}
        {input("state", "State / region", { autoComplete: "address-level1" })}
      </div>
      <div className="form-grid">
        {input("postal_code", "Postal code", { required: true, autoComplete: "postal-code" })}
        <label className="field">
          <span>Country</span>
          <select value={form.country} onChange={set("country")} required aria-invalid={!!errors.country}>
            <option value="">Choose…</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.country && <small className="field-error">{[].concat(errors.country).join(" ")}</small>}
        </label>
      </div>
      {input("phone_number", "Phone (for the courier)", { type: "tel", autoComplete: "tel" })}
      <label className="check">
        <input type="checkbox" checked={form.is_default} onChange={set("is_default")} /> Use as my default address
      </label>
      <div className="action-row">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save address"}</button>
        <button type="button" className="btn btn-outline" onClick={() => onDone(false)}>Cancel</button>
      </div>
    </form>
  );
}

function OrdersTab() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    ordersApi.list().then((d) => setList(d.results || d)).catch((e) => setError(e.message));
  }, []);
  if (error) return <p className="error-banner">{error}</p>;
  if (!list) return <p>Loading…</p>;
  if (!list.length)
    return (
      <div className="empty-state">
        No orders yet. <Link to="/">Start shopping.</Link>
      </div>
    );
  return list.map((o) => (
    <OrderCard key={o.id} order={o} onChange={(n) => setList((l) => l.map((x) => (x.id === n.id ? n : x)))} />
  ));
}

function WishlistTab() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    wishApi.list().then(setItems).catch((e) => setError(e.message));
  }, []);
  if (error) return <p className="error-banner">{error}</p>;
  if (!items) return <p>Loading…</p>;
  if (!items.length)
    return (
      <div className="empty-state">
        Nothing saved yet. Tap the heart on any product to keep it here. <Link to="/">Browse the shop.</Link>
      </div>
    );
  return (
    <div className="grid">
      {items.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}

function SecurityTab() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ current: "", next: "", again: "" });
  const [pwError, setPwError] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState({ open: false, password: "", confirmation: "", error: "" });

  async function changePw(e) {
    e.preventDefault();
    setPwError("");
    if (pw.next !== pw.again) return setPwError("The new passwords don't match.");
    setBusy(true);
    try {
      await profileApi.changePassword(pw.current, pw.next);
      logout();
      toast("Password updated. Please sign in again.");
      navigate("/login");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount(e) {
    e.preventDefault();
    setDel((d) => ({ ...d, error: "" }));
    try {
      await profileApi.deleteAccount(del.password, del.confirmation);
      logout();
      toast("Your account has been deleted");
      navigate("/");
    } catch (err) {
      setDel((d) => ({ ...d, error: err.message }));
    }
  }

  return (
    <div className="stack">
      <form onSubmit={changePw} className="form-card" noValidate>
        <h2 className="section-title">Change password</h2>
        {pwError && <p className="error-banner">{pwError}</p>}
        <label className="field"><span>Current password</span>
          <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
        </label>
        <label className="field"><span>New password</span>
          <input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required />
        </label>
        <label className="field"><span>Repeat new password</span>
          <input type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} required />
        </label>
        <button className="btn btn-primary" disabled={busy || !pw.current || !pw.next}>{busy ? "Updating…" : "Update password"}</button>
      </form>

      <div className="form-card danger-zone">
        <h2 className="section-title">Delete account</h2>
        <p className="muted">
          This signs you out everywhere and removes your personal details. Order records are kept without your name
          so sellers' books stay correct. This cannot be undone.
        </p>
        {!del.open ? (
          <button className="btn btn-outline danger" onClick={() => setDel({ ...del, open: true })}>Delete my account…</button>
        ) : (
          <form onSubmit={deleteAccount} noValidate>
            {del.error && <p className="error-banner">{del.error}</p>}
            <label className="field"><span>Your password</span>
              <input type="password" autoComplete="current-password" value={del.password} onChange={(e) => setDel({ ...del, password: e.target.value })} required />
            </label>
            <label className="field"><span>Type your username (<b>{user.username}</b>) to confirm</span>
              <input value={del.confirmation} onChange={(e) => setDel({ ...del, confirmation: e.target.value })} required />
            </label>
            <div className="action-row">
              <button className="btn btn-danger" disabled={!del.password || del.confirmation !== user.username}>Permanently delete</button>
              <button type="button" className="btn btn-outline" onClick={() => setDel({ open: false, password: "", confirmation: "", error: "" })}>Keep my account</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PreferencesTab() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [busyKey, setBusyKey] = useState("");

  async function toggle(key) {
    setBusyKey(key);
    try {
      setUser(await profileApi.update({ [key]: !user[key] }));
      toast("Preference saved");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusyKey("");
    }
  }

  const row = (key, title, text) => (
    <label className="pref-row">
      <span>
        <strong>{title}</strong>
        <small className="muted">{text}</small>
      </span>
      <input type="checkbox" role="switch" checked={!!user[key]} disabled={busyKey === key} onChange={() => toggle(key)} />
    </label>
  );

  return (
    <div className="form-card">
      <h2 className="section-title">Email preferences</h2>
      {row("order_update_emails", "Order updates", "Confirmation and shipping notices for your orders.")}
      {row("marketing_emails", "News & offers", "Occasional editorial picks and sales.")}
      <p className="muted" style={{ marginTop: 12 }}>
        These choices are saved to your account. Email delivery itself is not switched on in this version of the platform.
      </p>
    </div>
  );
}
