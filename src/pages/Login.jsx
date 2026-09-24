import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate(params.get("next") || "/");
    } catch (e) {
      setError("Wrong username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1 style={{ fontFamily: "var(--display)", marginTop: 40 }}>Log in</h1>
      <form className="form" onSubmit={handleSubmit}>
        {error && <p className="error-banner">{error}</p>}
        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
        <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
