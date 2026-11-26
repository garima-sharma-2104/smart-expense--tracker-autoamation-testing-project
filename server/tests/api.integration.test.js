/**
 * Integration tests against a REAL MongoDB TEST database.
 * Skipped unless MONGO_URI_TEST is set. The database name must end with "-test".
 *
 * PowerShell:
 *   $env:MONGO_URI_TEST="mongodb://127.0.0.1:27017/smart-expense-tracker-test"; npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const URI = process.env.MONGO_URI_TEST;
const dbName = URI ? URI.split("?")[0].split("/").pop() : "";
const SKIP = !URI
  ? "MONGO_URI_TEST not set - integration tests skipped"
  : !dbName.endsWith("-test")
  ? 'MONGO_URI_TEST must point to a database whose name ends with "-test"'
  : false;

process.env.JWT_SECRET = process.env.JWT_SECRET || "integration-test-secret";

test("API integration (MongoDB test database)", { skip: SKIP }, async (t) => {
  const mongoose = require("mongoose");
  const app = require("../app");
  const User = require("../models/User");
  const Expense = require("../models/Expense");
  const Income = require("../models/Income");
  const Group = require("../models/Group");
  const GroupExpense = require("../models/GroupExpense");

  await mongoose.connect(URI);
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const stamp = Date.now();
  const createdEmails = [];

  const api = async (method, path, { token, body } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json = null;
    try { json = await res.json(); } catch { /* empty body */ }
    return { status: res.status, body: json };
  };
  const register = async (label) => {
    const email = `it_${label}_${stamp}@example.test`;
    createdEmails.push(email);
    const r = await api("POST", "/api/auth/register", { body: { name: `User ${label}`, email, password: "Passw0rd!" } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return { email, token: r.body.data.token, id: r.body.data._id };
  };

  const A = await register("a");
  const B = await register("b");
  const C = await register("c");

  try {
    await t.test("duplicate registration -> 409, email is case-insensitive", async () => {
      const r = await api("POST", "/api/auth/register", { body: { name: "X", email: A.email.toUpperCase(), password: "Passw0rd!" } });
      assert.equal(r.status, 409);
    });

    await t.test("login success / wrong password / unknown email", async () => {
      assert.equal((await api("POST", "/api/auth/login", { body: { email: A.email, password: "Passw0rd!" } })).status, 200);
      assert.equal((await api("POST", "/api/auth/login", { body: { email: A.email, password: "wrong-pass" } })).status, 401);
      assert.equal((await api("POST", "/api/auth/login", { body: { email: "nobody@example.test", password: "Passw0rd!" } })).status, 401);
    });

    await t.test("password is stored hashed and never returned", async () => {
      const stored = await User.findOne({ email: A.email }).select("+password");
      assert.notEqual(stored.password, "Passw0rd!");
      assert.match(stored.password, /^\$2[aby]\$/);
      const me = await api("GET", "/api/auth/me", { token: A.token });
      assert.equal(me.body.data.password, undefined);
    });

    let expenseId;
    await t.test("expense create / read / update / delete", async () => {
      const created = await api("POST", "/api/expenses", { token: A.token, body: { title: "Lunch", amount: 120.5, category: "Food" } });
      assert.equal(created.status, 201);
      expenseId = created.body.data._id;
      assert.equal(created.body.data.amount, 120.5);

      const list = await api("GET", "/api/expenses", { token: A.token });
      assert.equal(list.body.count, 1);

      const upd = await api("PUT", `/api/expenses/${expenseId}`, { token: A.token, body: { amount: 99 } });
      assert.equal(upd.status, 200);
      assert.equal(upd.body.data.amount, 99);
      assert.equal(upd.body.data.title, "Lunch");
    });

    await t.test("invalid expense input -> 400", async () => {
      for (const body of [
        { title: "x" },
        { title: "x", amount: -5 },
        { title: "x", amount: "abc" },
        { title: "x", amount: 5, category: "Nope" },
        { amount: 5 },
      ]) {
        const r = await api("POST", "/api/expenses", { token: A.token, body });
        assert.equal(r.status, 400, JSON.stringify(body));
        assert.equal(r.body.success, false);
      }
    });

    await t.test("malformed id -> 400, missing id -> 404", async () => {
      assert.equal((await api("GET", "/api/expenses/not-an-id", { token: A.token })).status, 400);
      assert.equal((await api("GET", "/api/expenses/507f1f77bcf86cd799439011", { token: A.token })).status, 404);
    });

    await t.test("authorization: user B cannot read, change, reassign or delete A's expense", async () => {
      assert.equal((await api("GET", `/api/expenses/${expenseId}`, { token: B.token })).status, 404);
      assert.equal((await api("PUT", `/api/expenses/${expenseId}`, { token: B.token, body: { title: "hacked" } })).status, 404);
      assert.equal((await api("DELETE", `/api/expenses/${expenseId}`, { token: B.token })).status, 404);
      assert.equal((await api("GET", "/api/expenses", { token: B.token })).body.count, 0);
    });

    await t.test("mass assignment: client-supplied 'user' is ignored on create and update", async () => {
      const created = await api("POST", "/api/expenses", { token: A.token, body: { title: "Mine", amount: 5, user: B.id } });
      assert.equal(created.status, 201);
      assert.equal(created.body.data.user, A.id);
      const upd = await api("PUT", `/api/expenses/${created.body.data._id}`, { token: A.token, body: { user: B.id } });
      assert.equal(upd.body.data.user, A.id);
      assert.equal((await api("GET", "/api/expenses", { token: B.token })).body.count, 0);
    });

    await t.test("filters: category, amount range, regex-safe search", async () => {
      await api("POST", "/api/expenses", { token: A.token, body: { title: "Bus (a+b)", amount: 40, category: "Transport" } });
      const cat = await api("GET", "/api/expenses?category=Transport", { token: A.token });
      assert.equal(cat.body.count, 1);
      const range = await api("GET", "/api/expenses?minAmount=50&maxAmount=100", { token: A.token });
      assert.ok(range.body.data.every((e) => e.amount >= 50 && e.amount <= 100));
      const search = await api("GET", "/api/expenses?search=" + encodeURIComponent("(a+b"), { token: A.token });
      assert.equal(search.status, 200);
      assert.equal(search.body.count, 1);
      assert.equal((await api("GET", "/api/expenses?category=Nope", { token: A.token })).status, 400);
    });

    await t.test("editing a recurring expense does not reset its schedule", async () => {
      const created = await api("POST", "/api/expenses", {
        token: A.token,
        body: { title: "Rent", amount: 500, category: "Bills", date: "2026-01-01", isRecurring: true, recurrenceInterval: "Monthly" },
      });
      assert.equal(created.status, 201);
      const id = created.body.data._id;
      const firstNext = created.body.data.nextDueDate;
      // processing advances the schedule
      assert.equal((await api("POST", "/api/expenses/process-recurring", { token: A.token })).status, 200);
      const afterProcess = (await api("GET", `/api/expenses/${id}`, { token: A.token })).body.data.nextDueDate;
      assert.notEqual(afterProcess, firstNext);
      // a plain edit (title only, same date) must keep the advanced schedule
      const edited = await api("PUT", `/api/expenses/${id}`, { token: A.token, body: { title: "Rent v2", date: "2026-01-01" } });
      assert.equal(edited.body.data.nextDueDate, afterProcess);
      // running the processor again immediately must not create duplicates
      const before = (await api("GET", "/api/expenses", { token: A.token })).body.count;
      await api("POST", "/api/expenses/process-recurring", { token: A.token });
      assert.equal((await api("GET", "/api/expenses", { token: A.token })).body.count, before);
    });

    await t.test("expense delete", async () => {
      assert.equal((await api("DELETE", `/api/expenses/${expenseId}`, { token: A.token })).status, 200);
      assert.equal((await api("GET", `/api/expenses/${expenseId}`, { token: A.token })).status, 404);
    });

    await t.test("income create / validate / isolate / delete", async () => {
      const ok = await api("POST", "/api/income", { token: A.token, body: { source: "Salary", amount: 50000, category: "Salary" } });
      assert.equal(ok.status, 201);
      assert.equal((await api("POST", "/api/income", { token: A.token, body: { source: "X", amount: -1 } })).status, 400);
      assert.equal((await api("POST", "/api/income", { token: A.token, body: { source: "X", amount: 5, category: "Food" } })).status, 400);
      assert.equal((await api("GET", "/api/income", { token: B.token })).body.count, 0);
      assert.equal((await api("DELETE", `/api/income/${ok.body.data._id}`, { token: B.token })).status, 404);
      assert.equal((await api("DELETE", `/api/income/${ok.body.data._id}`, { token: A.token })).status, 200);
    });

    await t.test("monthly budget validation", async () => {
      assert.equal((await api("PUT", "/api/auth/budget", { token: A.token, body: { budget: 15000 } })).body.data.monthlyBudget, 15000);
      assert.equal((await api("PUT", "/api/auth/budget", { token: A.token, body: { budget: -1 } })).status, 400);
      assert.equal((await api("PUT", "/api/auth/budget", { token: A.token, body: { budget: "abc" } })).status, 400);
      assert.equal((await api("PUT", "/api/auth/budget", { token: A.token, body: {} })).status, 400);
    });

    await t.test("analytics summary reflects current-month spend", async () => {
      await api("POST", "/api/expenses", { token: B.token, body: { title: "Today", amount: 200, category: "Health" } });
      const r = await api("GET", "/api/expenses/analytics/summary", { token: B.token });
      assert.equal(r.status, 200);
      assert.equal(r.body.data.currentMonthTotal, 200);
      assert.equal(r.body.data.highestCategory, "Health");
    });

    await t.test("SplitSphere: groups, membership, split and settlement", async () => {
      const g = await api("POST", "/api/groups", { token: A.token, body: { name: "Trip" } });
      assert.equal(g.status, 201);
      const gid = g.body.data._id;
      assert.equal((await api("POST", "/api/groups", { token: A.token, body: { name: "  " } })).status, 400);

      // access restriction
      assert.equal((await api("GET", `/api/groups/${gid}`, { token: B.token })).status, 403);
      assert.equal((await api("GET", `/api/groups/${gid}/analytics`, { token: B.token })).status, 403);
      assert.equal((await api("POST", `/api/groups/${gid}/expenses`, { token: B.token, body: { title: "x", amount: 1 } })).status, 403);
      assert.equal((await api("POST", `/api/groups/${gid}/members`, { token: B.token, body: { email: B.email } })).status, 403);

      // member handling
      assert.equal((await api("POST", `/api/groups/${gid}/members`, { token: A.token, body: { email: B.email } })).status, 200);
      assert.equal((await api("POST", `/api/groups/${gid}/members`, { token: A.token, body: { email: B.email } })).status, 400);
      assert.equal((await api("POST", `/api/groups/${gid}/members`, { token: A.token, body: { email: "ghost@example.test" } })).status, 404);

      // validation: amount, outsider participant/payer
      assert.equal((await api("POST", `/api/groups/${gid}/expenses`, { token: A.token, body: { title: "x", amount: -5 } })).status, 400);
      assert.equal((await api("POST", `/api/groups/${gid}/expenses`, { token: A.token, body: { title: "x", amount: 10, participants: [C.id] } })).status, 400);
      assert.equal((await api("POST", `/api/groups/${gid}/expenses`, { token: A.token, body: { title: "x", amount: 10, paidBy: C.id } })).status, 400);

      // A pays 300, split equally between A and B -> B owes A 150
      const e = await api("POST", `/api/groups/${gid}/expenses`, { token: A.token, body: { title: "Hotel", amount: 300 } });
      assert.equal(e.status, 201);
      const an = await api("GET", `/api/groups/${gid}/analytics`, { token: B.token });
      assert.equal(an.body.data.totalGroupSpend, 300);
      assert.equal(an.body.data.settlementSummary.length, 1);
      assert.equal(an.body.data.settlementSummary[0].amount, 150);
      assert.equal(an.body.data.settlementSummary[0].from, "User b");
      assert.equal(an.body.data.settlementSummary[0].to, "User a");

      // groups list only includes the user's groups
      assert.equal((await api("GET", "/api/groups", { token: C.token })).body.data.length, 0);
      assert.equal((await api("GET", "/api/groups", { token: B.token })).body.data.length, 1);
    });
  } finally {
    // Cleanup: remove only the records created by this run (test database only)
    const users = await User.find({ email: { $in: createdEmails } }).select("_id");
    const ids = users.map((u) => u._id);
    const groups = await Group.find({ createdBy: { $in: ids } }).select("_id");
    await GroupExpense.deleteMany({ group: { $in: groups.map((g) => g._id) } });
    await Group.deleteMany({ _id: { $in: groups.map((g) => g._id) } });
    await Expense.deleteMany({ user: { $in: ids } });
    await Income.deleteMany({ user: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    await new Promise((r) => server.close(r));
    await mongoose.disconnect();
  }
});
