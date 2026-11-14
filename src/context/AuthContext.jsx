import { createContext, useContext, useEffect, useState } from "react";
import { auth as authApi } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authApi
      .restore()
      .then((ok) => (ok ? authApi.me() : null))
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("souk:auth-expired", onExpired);
    return () => window.removeEventListener("souk:auth-expired", onExpired);
  }, []);

  async function login(username, password) {
    await authApi.login(username, password);
    const me = await authApi.me();
    setUser(me);
    return me;
  }

  async function register(payload) {
    await authApi.register(payload);
    return login(payload.username, payload.password);
  }

  function logout() {
    authApi.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
