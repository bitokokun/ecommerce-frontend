import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orders } from "../api.js";
import { useCart } from "../context/CartContext.jsx";

export default function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
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

  useEffect(() => {
    orders.addresses.list().then((data) => {
      const list = data.results || data;
      setAddresses(list);
      if (list.length) setSelectedId(list[0].id);
      else setShowForm(true);
    });
  }, []);

  async function handleSaveAddress(e) {
    e.preventDefault();
    setError("");
    try {
      const created = await orders.addresses.create(form);
      setAddresses((a) => [...a, created]);
      setSelectedId(created.id);
      setShowForm(false);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handlePlaceOrder() {
    setError("");
    setPlacing(true);
    try {
      const order = await orders.checkout(selectedId);
      await refresh();
      navigate("/orders", { state: { justPlaced: order.id } });
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 560, paddingBottom: 80 }}>
      <h1 style={{ fontFamily: "var(--display)", marginTop: 40 }}>Checkout</h1>

      <h3>Ship to</h3>
      {addresses.map((a) => (
        <label key={a.id} style={{ display: "flex", gap: 10, alignItems: "start", marginBottom: 10 }}>
          <input
            type="radio"
            name="address"
            checked={selectedId === a.id}
            onChange={() => setSelectedId(a.id)}
          />
          <span>
            {a.full_name} — {a.line1}, {a.city}, {a.postal_code}, {a.country}
          </span>
        </label>
      ))}

      <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => setShowForm((s) => !s)}>
        {showForm ? "Cancel" : "Add new address"}
      </button>

      {showForm && (
        <form className="form" onSubmit={handleSaveAddress}>
          <div className="field">
            <label>Full name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Address line</label>
            <input
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>City</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Postal code</label>
            <input
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Country</label>
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary">Save address</button>
        </form>
      )}

      <div className="cart-summary" style={{ marginTop: 32 }}>
        <span>Total</span>
        <span>${cart.total}</span>
      </div>

      {error && <p className="error-banner" style={{ marginTop: 16 }}>{error}</p>}

      <button
        className="btn btn-saffron"
        style={{ marginTop: 20, width: "100%" }}
        disabled={!selectedId || placing}
        onClick={handlePlaceOrder}
      >
        {placing ? "Placing order…" : "Place order"}
      </button>
      <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: 10 }}>
        Payment integration isn't wired up yet — this creates a pending order for now.
      </p>
    </div>
  );
}
