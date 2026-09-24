// In production (Render static site), set VITE_API_URL to the live backend,
// e.g. https://ecommerce-backend-quog.onrender.com/api
// Locally, this is left unset so requests go through Vite's dev proxy (/api
// -> localhost:8000, configured in vite.config.js) instead.
const BASE = import.meta.env.VITE_API_URL || "/api";

function getTokens() {
  return {
    access: localStorage.getItem("access"),
    refresh: localStorage.getItem("refresh"),
  };
}

function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

async function refreshAccessToken() {
  const { refresh } = getTokens();
  if (!refresh) return null;
  const res = await fetch(`${BASE}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  setTokens({ access: data.access });
  return data.access;
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  let { access } = getTokens();
  if (auth && access) headers["Authorization"] = `Bearer ${access}`;

  let res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers["Authorization"] = `Bearer ${newAccess}`;
      res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message =
      (data && (data.detail || JSON.stringify(data))) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const auth = {
  async login(username, password) {
    const data = await api("/auth/token/", {
      method: "POST",
      body: { username, password },
      auth: false,
    });
    setTokens(data);
    return data;
  },
  async register(payload) {
    return api("/accounts/register/", { method: "POST", body: payload, auth: false });
  },
  async me() {
    return api("/accounts/me/");
  },
  logout() {
    clearTokens();
  },
};

export const catalog = {
  list(params = "") {
    return api(`/catalog/products/${params}`, { auth: false });
  },
  detail(id) {
    return api(`/catalog/products/${id}/`, { auth: false });
  },
  categories() {
    return api("/catalog/categories/", { auth: false });
  },
};

export const cart = {
  // auth defaults to true: this attaches the JWT when the user is logged in
  // (so the cart binds to their account), but works fine for guests too,
  // since api() only sends the header when a token actually exists.
  get() {
    return api("/cart/");
  },
  addItem(variantId, quantity = 1) {
    return api("/cart/items/", { method: "POST", body: { variant: variantId, quantity } });
  },
  updateItem(itemId, quantity) {
    return api(`/cart/items/${itemId}/`, { method: "PATCH", body: { quantity } });
  },
  removeItem(itemId) {
    return api(`/cart/items/${itemId}/`, { method: "DELETE" });
  },
};

export const orders = {
  checkout(shippingAddressId) {
    return api("/orders/checkout/", {
      method: "POST",
      body: { shipping_address_id: shippingAddressId },
    });
  },
  list() {
    return api("/orders/");
  },
  addresses: {
    list() {
      return api("/accounts/addresses/");
    },
    create(payload) {
      return api("/accounts/addresses/", { method: "POST", body: payload });
    },
  },
};
