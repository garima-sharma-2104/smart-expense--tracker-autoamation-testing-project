const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validateObjectId } = require("../middleware/validateObjectId");
const {
  createGroup,
  addMember,
  getUserGroups,
  getGroupDetails,
  addGroupExpense,
  getGroupAnalytics
} = require("../controllers/groupController");

// All group routes are protected
router.use(protect);

// Reject malformed :id params with 400 before they reach the database
router.param("id", (req, res, next) => validateObjectId(req, res, next));

router.route("/")
  .get(getUserGroups)
  .post(createGroup);

router.route("/:id")
  .get(getGroupDetails);

router.route("/:id/members")
  .post(addMember);

router.route("/:id/expenses")
  .post(addGroupExpense);

router.route("/:id/analytics")
  .get(getGroupAnalytics);

module.exports = router;
