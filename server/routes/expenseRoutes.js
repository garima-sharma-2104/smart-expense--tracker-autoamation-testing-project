const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validateObjectId } = require("../middleware/validateObjectId");
const {
  getExpenses,
  addExpense,
  getExpense,
  updateExpense,
  deleteExpense,
  getAnalytics,
  processRecurringTransactions,
} = require("../controllers/expenseController");

// Protect all routes
router.use(protect);

// Advanced features routes MUST be before /:id routes
router.get("/analytics/summary", getAnalytics);
router.post("/process-recurring", processRecurringTransactions);

// Standard CRUD routes
router.route("/").get(getExpenses).post(addExpense);
router.param("id", (req, res, next) => validateObjectId(req, res, next));
router.route("/:id").get(getExpense).put(updateExpense).delete(deleteExpense);

module.exports = router;
