/**
 * API tests that do NOT need MongoDB: they only exercise code paths that
 * respond before any database call (auth guard, input validation, routing).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
process.env.JWT_SECRET = "api-nodb-test-secret";
const app = require("../app");

let server, base;
test.before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise((r) => server.close(r)));

const call = (path, opts = {}) =>
  fetch(base + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
const post = (path, body) => call(path, { method: "POST", body: JSON.stringify(body) });

test("GET /api/health returns ok", async () => {
  const res = await call("/api/health");
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, "ok");
});

for (const path of ["/api/expenses", "/api/income", "/api/groups", "/api/auth/me", "/api/expenses/analytics/summary"]) {
  test(`GET ${path} without token -> 401`, async () => {
    const res = await call(path);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });
}

test("protected route with a garbage token -> 401", async () => {
  const res = await call("/api/expenses", { headers: { Authorization: "Bearer not.a.jwt" } });
  assert.equal(res.status, 401);
});

test("register: missing fields -> 400", async () => {
  const res = await post("/api/auth/register", { email: "a@b.co" });
  assert.equal(res.status, 400);
});

test("register: invalid email / short password -> 400", async () => {
  assert.equal((await post("/api/auth/register", { name: "A", email: "bad", password: "secret1" })).status, 400);
  assert.equal((await post("/api/auth/register", { name: "A", email: "a@b.co", password: "123" })).status, 400);
});

test("register/login: non-string values (NoSQL operator injection) -> 400", async () => {
  assert.equal((await post("/api/auth/login", { email: { $gt: "" }, password: { $gt: "" } })).status, 400);
  assert.equal((await post("/api/auth/register", { name: "A", email: { $gt: "" }, password: "secret1" })).status, 400);
});

test("login: missing password -> 400", async () => {
  assert.equal((await post("/api/auth/login", { email: "a@b.co" })).status, 400);
});

test("malformed JSON body -> 400 JSON error", async () => {
  const res = await call("/api/auth/login", { method: "POST", body: "{oops" });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).success, false);
});

test("unknown API route -> 404 JSON", async () => {
  const res = await call("/api/nope");
  assert.equal(res.status, 404);
  assert.equal((await res.json()).message, "Route not found");
});
