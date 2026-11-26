const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validateObjectId } = require("../middleware/validateObjectId");
const {
  getIncomes,
  addIncome,
  getIncome,
  updateIncome,
  deleteIncome,
} = require("../controllers/incomeController");

// Protect all routes
router.use(protect);

// Reject malformed :id params with 400 before they reach the database
router.param("id", (req, res, next) => validateObjectId(req, res, next));

router.route("/").get(getIncomes).post(addIncome);
router.route("/:id").get(getIncome).put(updateIncome).delete(deleteIncome);

module.exports = router;
