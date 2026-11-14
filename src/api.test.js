import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
};
const events = [];
globalThis.window = { dispatchEvent: (e) => events.push(e.type) };

const { api, auth, orders, clearTokens, refreshAccessToken } = await import("./api.js");

let calls = [];
let handler = () => json({});

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  return handler(String(url), init, calls.length);
};

beforeEach(() => {
  memory.clear();
  clearTokens();
  events.length = 0;
  calls = [];
  handler = () => json({});
});

const bearer = (call) => call.init.headers.Authorization;

test("login keeps the access token in memory and only the refresh token in storage", async () => {
  handler = () => json({ access: "A1", refresh: "R1" });
  await auth.login("ana", "pw");
  assert.equal(memory.get("refresh"), "R1");
  assert.equal(memory.has("access"), false);
  handler = () => json({ ok: true });
  await api("/accounts/me/");
  assert.equal(bearer(calls.at(-1)), "Bearer A1");
});

test("an expired access token is refreshed once and the request is retried", async () => {
  memory.set("refresh", "R1");
  handler = (url, init) => {
    if (url.endsWith("/auth/token/refresh/")) return json({ access: "A2", refresh: "R2" });
    return init.headers.Authorization === "Bearer A2" ? json({ ok: true }) : json({ detail: "expired" }, 401);
  };
  const data = await api("/accounts/me/");
  assert.deepEqual(data, { ok: true });
  assert.equal(memory.get("refresh"), "R2");
  assert.equal(calls.filter((c) => c.url.endsWith("/auth/token/refresh/")).length, 1);
});

test("parallel 401s share a single refresh request", async () => {
  memory.set("refresh", "R1");
  let refreshes = 0;
  handler = async (url, init) => {
    if (url.endsWith("/auth/token/refresh/")) {
      refreshes += 1;
      await new Promise((r) => setTimeout(r, 10));
      return json({ access: "A2", refresh: "R2" });
    }
    return init.headers.Authorization === "Bearer A2" ? json({ ok: true }) : json({}, 401);
  };
  await Promise.all([api("/a/"), api("/b/"), api("/c/")]);
  assert.equal(refreshes, 1);
});

test("a rejected refresh token signs the user out", async () => {
  memory.set("refresh", "R1");
  handler = () => json({ detail: "bad" }, 401);
  await assert.rejects(api("/accounts/me/"), (e) => e.status === 401);
  assert.equal(memory.has("refresh"), false);
  assert.deepEqual(events, ["souk:auth-expired"]);
});

test("without a refresh token a 401 is surfaced without calling the refresh endpoint", async () => {
  handler = () => json({ detail: "Authentication credentials were not provided." }, 401);
  await assert.rejects(api("/accounts/me/"), /Authentication credentials/);
  assert.equal(calls.some((c) => c.url.endsWith("/auth/token/refresh/")), false);
});

test("restore does nothing without a stored refresh token", async () => {
  assert.equal(await auth.restore(), false);
  assert.equal(calls.length, 0);
});

test("restore exchanges the stored refresh token and drops the legacy access token", async () => {
  memory.set("refresh", "R1");
  memory.set("access", "old");
  handler = () => json({ access: "A9", refresh: "R9" });
  assert.equal(await auth.restore(), true);
  assert.equal(memory.has("access"), false);
  assert.equal(memory.get("refresh"), "R9");
});

test("logout revokes the refresh token on the server and clears storage", async () => {
  memory.set("refresh", "R1");
  handler = () => new Response(null, { status: 204 });
  await auth.logout();
  const call = calls.at(-1);
  assert.ok(call.url.endsWith("/auth/logout/"));
  assert.deepEqual(JSON.parse(call.init.body), { refresh: "R1" });
  assert.equal(memory.has("refresh"), false);
});

test("logout still clears local state when the network is down", async () => {
  memory.set("refresh", "R1");
  handler = () => {
    throw new TypeError("offline");
  };
  await auth.logout();
  assert.equal(memory.has("refresh"), false);
});

test("checkout sends the idempotency key and the address", async () => {
  handler = () => json({ id: 7 }, 201);
  await orders.checkout(12, "key-abcdefgh");
  const call = calls.at(-1);
  assert.equal(call.init.headers["Idempotency-Key"], "key-abcdefgh");
  assert.deepEqual(JSON.parse(call.init.body), { shipping_address_id: 12 });
});

test("checkout without a key omits the header", async () => {
  handler = () => json({ id: 7 }, 201);
  await orders.checkout(12);
  assert.equal("Idempotency-Key" in calls.at(-1).init.headers, false);
});

test("validation errors become readable messages", async () => {
  handler = () => json({ email: ["Enter a valid email."], non_field_errors: ["Nope."] }, 400);
  await assert.rejects(api("/x/", { method: "POST", body: {} }), (e) => {
    assert.match(e.message, /email: Enter a valid email\./);
    assert.match(e.message, /Nope\./);
    return e.status === 400;
  });
});

test("detail arrays and non-JSON failures are handled", async () => {
  handler = () => json({ detail: ["One.", "Two."] }, 400);
  await assert.rejects(api("/x/"), /One\. Two\./);
  handler = () => new Response("<html>boom</html>", { status: 500, headers: { "content-type": "text/html" } });
  await assert.rejects(api("/x/"), /Request failed \(500\)/);
});

test("form uploads are sent without a JSON content type", async () => {
  handler = () => json({ ok: true });
  const form = new FormData();
  form.append("image", new Blob(["x"]), "a.png");
  await api("/upload/", { method: "POST", body: form });
  assert.equal("Content-Type" in calls.at(-1).init.headers, false);
});

test("refreshAccessToken resolves null when nothing is stored", async () => {
  assert.equal(await refreshAccessToken(), null);
});
