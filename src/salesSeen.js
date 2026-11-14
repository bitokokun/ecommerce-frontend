const key = (userId) => `souk_orders_seen_${userId}`;

export function getSeen(userId) {
  try {
    return localStorage.getItem(key(userId)) || "";
  } catch {
    return "";
  }
}

export function setSeen(userId, iso) {
  try {
    localStorage.setItem(key(userId), iso);
  } catch {
  }
  window.dispatchEvent(new Event("souk:orders-seen"));
}
