const test = require("node:test");
const assert = require("node:assert/strict");
const v = require("../utils/validators");

test("isValidId accepts 24-hex strings only", () => {
  assert.equal(v.isValidId("507f1f77bcf86cd799439011"), true);
  assert.equal(v.isValidId("123"), false);
  assert.equal(v.isValidId({ $ne: "x" }), false);
  assert.equal(v.isValidId(undefined), false);
});

test("toNumber / isValidAmount", () => {
  assert.equal(v.toNumber("12.50"), 12.5);
  assert.ok(Number.isNaN(v.toNumber("abc")));
  assert.ok(Number.isNaN(v.toNumber("")));
  assert.ok(Number.isNaN(v.toNumber(Infinity)));
  assert.equal(v.isValidAmount(0), false);
  assert.equal(v.isValidAmount(-5), false);
  assert.equal(v.isValidAmount(0.01), true);
  assert.equal(v.isValidAmount(v.MAX_AMOUNT + 1), false);
});

test("isValidEmail / normalizeEmail", () => {
  assert.equal(v.isValidEmail("a@b.co"), true);
  assert.equal(v.isValidEmail("a@b.info"), true);
  assert.equal(v.isValidEmail("not-an-email"), false);
  assert.equal(v.isValidEmail({ $gt: "" }), false);
  assert.equal(v.normalizeEmail("  Foo@Bar.COM "), "foo@bar.com");
});

test("escapeRegex neutralises regex metacharacters", () => {
  const re = new RegExp(v.escapeRegex("a.b(c"), "i");
  assert.ok(re.test("xx A.B(C yy"));
  assert.ok(!re.test("aXb(c"));
  assert.doesNotThrow(() => new RegExp(v.escapeRegex("(((")));
});

test("advanceDate steps by interval", () => {
  const d = new Date("2026-01-15T00:00:00Z");
  assert.equal(v.advanceDate(d, "Weekly").toISOString().slice(0, 10), "2026-01-22");
  assert.equal(v.advanceDate(d, "Monthly").getMonth(), 1);
  assert.equal(v.advanceDate(d, "Yearly").getFullYear(), 2027);
  assert.equal(v.advanceDate(d, "None"), null);
});

test("validateEntry: valid expense is whitelisted and typed", () => {
  const { errors, data } = v.validateEntry(
    { title: "  Lunch ", amount: "250.5", category: "Food", user: "attacker", _id: "x" },
    v.EXPENSE_CFG
  );
  assert.deepEqual(errors, []);
  assert.equal(data.title, "Lunch");
  assert.equal(data.amount, 250.5);
  assert.equal(data.user, undefined);
  assert.equal(data._id, undefined);
});

test("validateEntry: rejects missing / invalid fields", () => {
  const bad = (body, re) => {
    const { errors } = v.validateEntry(body, v.EXPENSE_CFG);
    assert.ok(errors.some((e) => re.test(e)), `expected ${re} in ${JSON.stringify(errors)}`);
  };
  bad({}, /Title is required/);
  bad({ title: "x" }, /Amount is required/);
  bad({ title: "x", amount: -1 }, /greater than 0/);
  bad({ title: "x", amount: 0 }, /greater than 0/);
  bad({ title: "x", amount: "abc" }, /greater than 0/);
  bad({ title: "x", amount: 5, category: "Nope" }, /Category/);
  bad({ title: "x", amount: 5, date: "not-a-date" }, /Date is invalid/);
  bad({ title: "x".repeat(101), amount: 5 }, /100 characters/);
  bad({ title: "x", amount: 5, isRecurring: true }, /recurrenceInterval/);
  bad({ title: { $ne: 1 }, amount: 5 }, /Title is required/);
});

test("validateEntry: partial mode only checks supplied fields", () => {
  assert.deepEqual(v.validateEntry({ title: "New" }, v.EXPENSE_CFG, { partial: true }).errors, []);
  assert.equal(v.validateEntry({ amount: -2 }, v.EXPENSE_CFG, { partial: true }).errors.length, 1);
});

test("validateEntry: income uses source and income categories", () => {
  const ok = v.validateEntry({ source: "Job", amount: 1000, category: "Salary" }, v.INCOME_CFG);
  assert.deepEqual(ok.errors, []);
  const bad = v.validateEntry({ source: "Job", amount: 1000, category: "Food" }, v.INCOME_CFG);
  assert.equal(bad.errors.length, 1);
});
