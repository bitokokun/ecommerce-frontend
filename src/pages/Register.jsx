import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingButton from "../components/LoadingButton.jsx";
import Turnstile, { TURNSTILE_SITE_KEY } from "../components/Turnstile.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [wantsToSell, setWantsToSell] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        ...form,
        role: wantsToSell ? "seller" : "customer",
        captcha_token: captchaToken,
      });
      navigate(wantsToSell ? "/sell" : "/");
    } catch (e) {
      setError(e.message);
      setCaptchaToken("");
      setCaptchaKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container auth-page">
      <header className="page-head">
        <h1>Create an account</h1>
        <p className="muted">It takes a minute. You can start shopping straight away.</p>
      </header>
      <form className="form" onSubmit={handleSubmit}>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="reg-username">Username</label>
          <input
            id="reg-username"
            value={form.username}
            autoComplete="username"
            autoCapitalize="none"
            onChange={(e) => update("username", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            value={form.email}
            autoComplete="email"
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            value={form.password}
            autoComplete="new-password"
            onChange={(e) => update("password", e.target.value)}
            required
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={wantsToSell} onChange={(e) => setWantsToSell(e.target.checked)} />
          I want to sell on Souk too
        </label>
        <Turnstile key={captchaKey} onToken={setCaptchaToken} />
        <LoadingButton
          type="submit"
          className="btn btn-primary btn-block"
          loading={loading}
          loadingText="Creating account…"
          disabled={Boolean(TURNSTILE_SITE_KEY && !captchaToken)}
        >
          Create account
        </LoadingButton>
        <p className="form-note">
          Already have one? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
