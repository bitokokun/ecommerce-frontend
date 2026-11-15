import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orders, accounts } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingButton from "../components/LoadingButton.jsx";
import { Skeleton } from "../components/Skeletons.jsx";

function newAttemptKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function Checkout() {
  const { cart, loading: cartLoading, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    line1: "",
    city: "",
    postal_code: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const attemptKey = useRef(null);

  useEffect(() => {
    attemptKey.current = null;
  }, [selectedId]);

  useEffect(() => {
    accounts.countries().then(setCountries).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    orders.addresses
      .list()
      .then((data) => {
        if (cancelled) return;
        const list = data.results || data;
        setAddresses(list);
        const preferred = list.find((a) => a.is_default) || list[0];
        if (preferred) setSelectedId(preferred.id);
        else setShowForm(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveAddress(e) {
    e.preventDefault();
    setError("");
    setSavingAddress(true);
    try {
      const created = await orders.addresses.create(form);
      setAddresses((a) => [...a, created]);
      setSelectedId(created.id);
      setShowForm(false);
      toast.success("Address saved");
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingAddress(false);
    }
  }

  async function handlePlaceOrder() {
    setError("");
    setPlacing(true);
    try {
      if (!attemptKey.current) attemptKey.current = newAttemptKey();
      const order = await orders.checkout(selectedId, attemptKey.current);
      attemptKey.current = null;
      await refresh();
      navigate("/orders", { state: { justPlaced: order.id } });
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  if (!cartLoading && !cart.items?.length && !placing) {
    return (
      <div className="container">
        <EmptyState
          icon="cart"
          title="Nothing to check out"
          text="Your cart is empty. Add something first, then come back here."
          action={{ label: "Continue shopping", to: "/" }}
        />
      </div>
    );
  }

  const field = (key, label, props = {}) => (
    <div className="field">
      <label htmlFor={`addr-${key}`}>{label}</label>
      <input
        id={`addr-${key}`}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required
        {...props}
      />
    </div>
  );

  return (
    <div className="container checkout-page">
      <header className="page-head">
        <h1>Checkout</h1>
      </header>

      <section aria-labelledby="ship-heading">
        <h2 id="ship-heading" className="section-heading">
          Ship to
        </h2>

        {addressesLoading ? (
          <div className="address-options" role="status" aria-busy="true">
            <span className="sr-only">Loading your addresses</span>
            <Skeleton className="address-skel" />
            <Skeleton className="address-skel" />
          </div>
        ) : (
          <div className="address-options" role="radiogroup" aria-labelledby="ship-heading">
            {addresses.map((a) => (
              <label key={a.id} className={`address-option${selectedId === a.id ? " selected" : ""}`}>
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                />
                <span>
                  <strong>{a.full_name}</strong>
                  <span className="address-lines">
                    {a.line1}, {a.city}, {a.postal_code}, {a.country}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {!addressesLoading && (
          <button type="button" className="btn btn-outline" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add new address"}
          </button>
        )}

        {showForm && (
          <form className="form address-form" onSubmit={handleSaveAddress}>
            {field("full_name", "Full name", { autoComplete: "name" })}
            {field("line1", "Address line", { autoComplete: "address-line1" })}
            <div className="form-row">
              {field("city", "City", { autoComplete: "address-level2" })}
              {field("postal_code", "Postal code", { autoComplete: "postal-code" })}
            </div>
            <div className="field">
              <label htmlFor="addr-country">Country</label>
              <select
                id="addr-country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                required
              >
                <option value="">{countries.length ? "Select a country" : "Loading countries…"}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <LoadingButton type="submit" className="btn btn-primary" loading={savingAddress} loadingText="Saving…">
              Save address
            </LoadingButton>
          </form>
        )}
      </section>

      <div className="cart-summary checkout-total">
        <span>Total</span>
        <span>${cart.total}</span>
      </div>

      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}

      <LoadingButton
        className="btn btn-saffron btn-block"
        disabled={!selectedId}
        loading={placing}
        loadingText="Placing order…"
        onClick={handlePlaceOrder}
      >
        Place order
      </LoadingButton>
      <p className="form-note">
        Payment integration isn't wired up yet — this creates a pending order for now.
      </p>
    </div>
  );
}
