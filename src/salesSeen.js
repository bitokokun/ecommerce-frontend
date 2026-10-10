// Remembers, in THIS browser, the newest order a seller has already looked at.
// Anything newer than that counts as "new" on the Sell link. (It's per
// browser, so a different phone or laptop starts from zero.)
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
    /* private mode etc. - the badge just won't clear between visits */
  }
  window.dispatchEvent(new Event("souk:orders-seen"));
}
