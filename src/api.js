const env = (typeof import.meta !== "undefined" && import.meta.env) || {};
const BASE = env.VITE_API_URL || "/api";
const COOKIE_AUTH = env.VITE_COOKIE_AUTH === "true";
const REFRESH_KEY = "refresh";

let accessToken = null;
let inflightRefresh = null;

function store() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function readRefresh() {
  return COOKIE_AUTH ? null : store()?.getItem(REFRESH_KEY) ?? null;
}

function writeRefresh(token) {
  if (!COOKIE_AUTH && token) store()?.setItem(REFRESH_KEY, token);
}

export function clearTokens() {
  accessToken = null;
  store()?.removeItem(REFRESH_KEY);
  store()?.removeItem("access");
}

function credentialsMode() {
  return COOKIE_AUTH ? "include" : "same-origin";
}

async function requestRefresh() {
  const used = readRefresh();
  if (!COOKIE_AUTH && !used) return null;
  const res = await fetch(`${BASE}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: credentialsMode(),
    body: COOKIE_AUTH ? "{}" : JSON.stringify({ refresh: used }),
  });
  if (!res.ok) {
    const latest = readRefresh();
    if (!COOKIE_AUTH && latest && latest !== used) return requestRefresh();
    return null;
  }
  const data = await res.json();
  accessToken = data.access;
  writeRefresh(data.refresh);
  return data.access;
}

export function refreshAccessToken() {
  if (!inflightRefresh) {
    inflightRefresh = requestRefresh()
      .catch(() => null)
      .finally(() => {
        inflightRefresh = null;
      });
  }
  return inflightRefresh;
}

function describeError(data, status) {
  if (!data) return `Request failed (${status})`;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.join(" ");
  const parts = Object.entries(data).map(([k, v]) => {
    const msg = Array.isArray(v) ? v.join(" ") : typeof v === "string" ? v : JSON.stringify(v);
    return k === "non_field_errors" ? msg : `${k.replace(/_/g, " ")}: ${msg}`;
  });
  return parts.join(" · ") || `Request failed (${status})`;
}

export async function api(path, { method = "GET", body, auth = true, headers: extra = {} } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = { ...(isForm ? {} : { "Content-Type": "application/json" }), ...extra };
  const payload = body ? (isForm ? body : JSON.stringify(body)) : undefined;
  if (auth && accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const send = () =>
    fetch(`${BASE}${path}`, { method, headers, body: payload, credentials: credentialsMode() });

  let res = await send();

  if (res.status === 401 && auth && (COOKIE_AUTH || readRefresh())) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      headers["Authorization"] = `Bearer ${fresh}`;
      res = await send();
    } else {
      clearTokens();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("souk:auth-expired"));
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("json") ? await res.json() : null;

  if (!res.ok) {
    const err = new Error(describeError(data, res.status));
    err.status = res.status;
    err.data = data;
    err.headers = res.headers;
    throw err;
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
    accessToken = data.access;
    writeRefresh(data.refresh);
    store()?.removeItem("access");
    return data;
  },
  async register(payload) {
    return api("/accounts/register/", { method: "POST", body: payload, auth: false });
  },
  async restore() {
    store()?.removeItem("access");
    if (!COOKIE_AUTH && !readRefresh()) return false;
    return Boolean(await refreshAccessToken());
  },
  async me() {
    return api("/accounts/me/");
  },
  async logout() {
    const refresh = readRefresh();
    clearTokens();
    try {
      await fetch(`${BASE}/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: credentialsMode(),
        body: JSON.stringify(refresh ? { refresh } : {}),
      });
    } catch {
      return;
    }
  },
};

export const profile = {
  update(payload) {
    return api("/accounts/me/", { method: "PATCH", body: payload });
  },
  uploadAvatar(file) {
    const form = new FormData();
    form.append("image", file);
    return api("/accounts/me/avatar/", { method: "POST", body: form });
  },
  removeAvatar() {
    return api("/accounts/me/avatar/", { method: "DELETE" });
  },
  changePassword(current_password, new_password) {
    return api("/accounts/password/", { method: "POST", body: { current_password, new_password } });
  },
  deleteAccount(password, confirmation) {
    return api("/accounts/delete/", { method: "POST", body: { password, confirmation } });
  },
};

export const wishlist = {
  list() {
    return api("/catalog/wishlist/");
  },
  ids() {
    return api("/catalog/wishlist/ids/");
  },
  add(productId) {
    return api("/catalog/wishlist/", { method: "POST", body: { product: productId } });
  },
  remove(productId) {
    return api(`/catalog/wishlist/${productId}/`, { method: "DELETE" });
  },
};

export const accounts = {
  countries() {
    return api("/accounts/countries/", { auth: false });
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

export const recommendations = {
  similar(productId, limit = 4) {
    return api(`/recommendations/similar/${productId}/?limit=${limit}`, { auth: false });
  },
  forYou(limit = 4) {
    return api(`/recommendations/for-you/?limit=${limit}`);
  },
};

export const seller = {
  mine() {
    return api("/catalog/products/mine/");
  },
  createProduct(payload) {
    return api("/catalog/products/", { method: "POST", body: payload });
  },
  updateProduct(id, payload) {
    return api(`/catalog/products/${id}/`, { method: "PATCH", body: payload });
  },
  addVariant(productId, payload) {
    return api(`/catalog/products/${productId}/variants/`, { method: "POST", body: payload });
  },
  updateVariant(productId, variantId, payload) {
    return api(`/catalog/products/${productId}/variants/${variantId}/`, {
      method: "PATCH",
      body: payload,
    });
  },
  deleteVariant(productId, variantId) {
    return api(`/catalog/products/${productId}/variants/${variantId}/`, { method: "DELETE" });
  },
  received() {
    return api("/orders/received/");
  },
  receivedCount(since = "") {
    const q = since ? `?since=${encodeURIComponent(since)}` : "";
    return api(`/orders/received/count/${q}`);
  },
  uploadImage(productId, file) {
    const form = new FormData();
    form.append("image", file);
    return api(`/catalog/products/${productId}/images/upload/`, { method: "POST", body: form });
  },
  store() {
    return api("/accounts/store/");
  },
  updateStore(payload) {
    return api("/accounts/store/", { method: "PATCH", body: payload });
  },
  uploadLogo(file) {
    const form = new FormData();
    form.append("image", file);
    return api("/accounts/store/logo/", { method: "POST", body: form });
  },
  removeLogo() {
    return api("/accounts/store/logo/", { method: "DELETE" });
  },
  stats() {
    return api("/orders/seller-stats/");
  },
  fulfil(orderId, payload) {
    return api(`/orders/received/${orderId}/fulfil/`, { method: "POST", body: payload });
  },
};

export const cart = {
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
  checkout(shippingAddressId, idempotencyKey) {
    return api("/orders/checkout/", {
      method: "POST",
      body: { shipping_address_id: shippingAddressId },
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    });
  },
  list() {
    return api("/orders/");
  },
  detail(id) {
    return api(`/orders/${id}/`);
  },
  cancel(id) {
    return api(`/orders/${id}/cancel/`, { method: "POST" });
  },
  addresses: {
    list() {
      return api("/accounts/addresses/");
    },
    create(payload) {
      return api("/accounts/addresses/", { method: "POST", body: payload });
    },
    update(id, payload) {
      return api(`/accounts/addresses/${id}/`, { method: "PATCH", body: payload });
    },
    remove(id) {
      return api(`/accounts/addresses/${id}/`, { method: "DELETE" });
    },
  },
};
