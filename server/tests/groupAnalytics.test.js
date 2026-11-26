const test = require("node:test");
const assert = require("node:assert/strict");
process.env.JWT_SECRET = process.env.JWT_SECRET || "unit-test-secret";
const { computeGroupAnalytics } = require("../controllers/groupController");

const members = [
  { _id: "a", name: "Asha" },
  { _id: "b", name: "Bala" },
  { _id: "c", name: "Chitra" },
];

test("equal split: payer is owed by the other two", () => {
  const r = computeGroupAnalytics(members, [
    { amount: 300, paidBy: "a", participants: ["a", "b", "c"] },
  ]);
  assert.equal(r.totalGroupSpend, 300);
  assert.equal(r.settlementSummary.length, 2);
  for (const s of r.settlementSummary) {
    assert.equal(s.to, "Asha");
    assert.equal(s.amount, 100);
  }
});

test("balanced expenses produce no settlements", () => {
  const r = computeGroupAnalytics(members, [
    { amount: 100, paidBy: "a", participants: ["a", "b"] },
    { amount: 100, paidBy: "b", participants: ["a", "b"] },
  ]);
  assert.equal(r.settlementSummary.length, 0);
});

test("settlement amounts net to zero across members", () => {
  const r = computeGroupAnalytics(members, [
    { amount: 90, paidBy: "a", participants: ["a", "b", "c"] },
    { amount: 60, paidBy: "b", participants: ["b", "c"] },
  ]);
  // Asha paid 90 and owes 30 (+60); Bala paid 60 and owes 60 (0); Chitra owes 30+30 (-60)
  assert.equal(r.settlementSummary.length, 1);
  assert.deepEqual(
    { from: r.settlementSummary[0].from, to: r.settlementSummary[0].to, amount: r.settlementSummary[0].amount },
    { from: "Chitra", to: "Asha", amount: 60 }
  );
});

test("no expenses -> empty summary and zero total", () => {
  const r = computeGroupAnalytics(members, []);
  assert.equal(r.totalGroupSpend, 0);
  assert.deepEqual(r.settlementSummary, []);
});
