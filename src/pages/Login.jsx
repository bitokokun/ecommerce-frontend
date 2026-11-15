import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingButton from "../components/LoadingButton.jsx";

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
      const next = params.get("next");
      navigate(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (e) {
      setError("Wrong username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container auth-page">
      <header className="page-head">
        <h1>Log in</h1>
        <p className="muted">Welcome back. Pick up where you left off.</p>
      </header>
      <form className="form" onSubmit={handleSubmit}>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            value={username}
            autoComplete="username"
            autoCapitalize="none"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <LoadingButton type="submit" className="btn btn-primary btn-block" loading={loading} loadingText="Logging in…">
          Log in
        </LoadingButton>
        <p className="form-note">
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
