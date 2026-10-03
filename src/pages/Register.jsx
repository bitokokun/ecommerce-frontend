import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [wantsToSell, setWantsToSell] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ ...form, role: wantsToSell ? "seller" : "customer" });
      navigate(wantsToSell ? "/sell" : "/");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1 style={{ fontFamily: "var(--display)", marginTop: 40 }}>Create an account</h1>
      <form className="form" onSubmit={handleSubmit}>
        {error && <p className="error-banner">{error}</p>}
        <div className="field">
          <label>Username</label>
          <input value={form.username} onChange={(e) => update("username", e.target.value)} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
          />
        </div>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.92rem" }}>
          <input
            type="checkbox"
            checked={wantsToSell}
            onChange={(e) => setWantsToSell(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          I want to sell on Souk too
        </label>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
        <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>
          Already have one? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
