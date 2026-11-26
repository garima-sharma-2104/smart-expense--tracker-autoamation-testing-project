const Group = require("../models/Group");
const GroupExpense = require("../models/GroupExpense");
const User = require("../models/User");
const { fail, handleError } = require("../utils/respond");
const {
  isNonEmptyString, isValidEmail, normalizeEmail, isValidId,
  toNumber, isValidAmount, isValidDate, MAX_AMOUNT,
} = require("../utils/validators");

const idOf = (m) => String(m && m._id ? m._id : m);
const isMember = (group, userId) => group.members.some((m) => idOf(m) === String(userId));

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!isNonEmptyString(name)) return fail(res, 400, "Group name is required.");
    if (name.trim().length > 100) return fail(res, 400, "Group name cannot exceed 100 characters.");

    const newGroup = await Group.create({
      name: name.trim(),
      createdBy: req.user.id,
      members: [req.user.id], // The creator is automatically a member
    });
    res.status(201).json({ success: true, data: newGroup });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Add a member to a group by email
// @route   POST /api/groups/:id/members
// @access  Private (group members only)
exports.addMember = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return fail(res, 400, "User email is required.");
    if (!isValidEmail(email)) return fail(res, 400, "Please provide a valid email.");

    const group = await Group.findById(req.params.id);
    if (!group) return fail(res, 404, "Group not found.");
    if (!isMember(group, req.user.id)) return fail(res, 403, "You are not a member of this group.");

    const userToAdd = await User.findOne({ email: normalizeEmail(email) });
    if (!userToAdd) return fail(res, 404, "User with this email not found.");
    if (isMember(group, userToAdd._id)) return fail(res, 400, "User is already a member.");

    group.members.push(userToAdd._id);
    await group.save();
    res.status(200).json({ success: true, message: "Member added successfully.", data: group });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get all groups for the logged-in user
// @route   GET /api/groups
// @access  Private
exports.getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id }).populate("members", "name email");
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get a single group's details
// @route   GET /api/groups/:id
// @access  Private (group members only)
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("members", "name email");
    if (!group) return fail(res, 404, "Group not found.");
    if (!isMember(group, req.user.id)) return fail(res, 403, "You are not a member of this group.");

    const expenses = await GroupExpense.find({ group: req.params.id })
      .populate("paidBy", "name")
      .populate("participants", "name")
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: { group, expenses } });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Add a group expense
// @route   POST /api/groups/:id/expenses
// @access  Private (group members only)
exports.addGroupExpense = async (req, res) => {
  try {
    const { title, amount, category, date, description, paidBy, participants } = req.body || {};

    const errors = [];
    if (!isNonEmptyString(title)) errors.push("Title is required");
    else if (title.trim().length > 100) errors.push("Title cannot exceed 100 characters");
    const amt = toNumber(amount);
    if (!isValidAmount(amt)) errors.push(`Amount must be a number greater than 0 and at most ${MAX_AMOUNT}`);
    if (category !== undefined && (typeof category !== "string" || category.length > 50)) errors.push("Category is invalid");
    if (date !== undefined && date !== "" && !isValidDate(date)) errors.push("Date is invalid");
    if (description !== undefined && (typeof description !== "string" || description.length > 500)) errors.push("Description is invalid");
    if (paidBy !== undefined && !isValidId(paidBy)) errors.push("paidBy is not a valid user id");
    if (participants !== undefined && (!Array.isArray(participants) || !participants.every(isValidId))) {
      errors.push("participants must be an array of valid user ids");
    }
    if (errors.length) return fail(res, 400, errors.join(", "), errors);

    const group = await Group.findById(req.params.id);
    if (!group) return fail(res, 404, "Group not found.");
    if (!isMember(group, req.user.id)) return fail(res, 403, "You are not a member of this group.");

    // Payer defaults to the current user; payer and participants must belong to the group
    const payer = paidBy || req.user.id;
    if (!isMember(group, payer)) return fail(res, 400, "Payer must be a member of the group.");

    let splitAmong;
    if (participants && participants.length > 0) {
      splitAmong = [...new Set(participants.map(String))];
      if (!splitAmong.every((p) => isMember(group, p))) {
        return fail(res, 400, "All participants must be members of the group.");
      }
    } else {
      splitAmong = group.members.map(idOf);
    }

    const newExpense = await GroupExpense.create({
      title: title.trim(),
      amount: amt,
      category: category || "Other",
      date: date ? new Date(date) : Date.now(),
      description,
      group: req.params.id,
      paidBy: payer,
      participants: splitAmong,
    });
    res.status(201).json({ success: true, data: newExpense });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Pure settlement calculation (exported for unit tests).
 * members: [{_id, name}], expenses: [{amount, paidBy, participants}]
 * Returns { totalGroupSpend, memberTotals, settlementSummary }.
 */
const computeGroupAnalytics = (members, expenses) => {
  let totalGroupSpend = 0;
  const memberTotals = {};
  const balances = {};

  members.forEach((m) => {
    const id = idOf(m);
    memberTotals[id] = { _id: m._id, name: m.name, totalPaid: 0 };
    balances[id] = { _id: m._id, name: m.name, netBalance: 0 };
  });

  expenses.forEach((exp) => {
    totalGroupSpend += exp.amount;
    const payerId = idOf(exp.paidBy);
    if (!balances[payerId]) return;
    if (!exp.participants || exp.participants.length === 0) return;

    memberTotals[payerId].totalPaid += exp.amount;
    balances[payerId].netBalance += exp.amount;

    const splitAmount = exp.amount / exp.participants.length;
    exp.participants.forEach((p) => {
      const pid = idOf(p);
      if (balances[pid]) balances[pid].netBalance -= splitAmount;
    });
  });

  const debtors = [];
  const creditors = [];
  Object.values(balances).forEach((b) => {
    if (b.netBalance < -0.01) debtors.push({ ...b, amountOwed: Math.abs(b.netBalance) });
    else if (b.netBalance > 0.01) creditors.push({ ...b, amountCredit: b.netBalance });
  });
  debtors.sort((a, b) => b.amountOwed - a.amountOwed);
  creditors.sort((a, b) => b.amountCredit - a.amountCredit);

  const settlementSummary = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settlementAmount = Math.min(debtor.amountOwed, creditor.amountCredit);
    settlementSummary.push({
      from: debtor.name, fromId: debtor._id,
      to: creditor.name, toId: creditor._id,
      amount: parseFloat(settlementAmount.toFixed(2)),
    });
    debtor.amountOwed -= settlementAmount;
    creditor.amountCredit -= settlementAmount;
    if (debtor.amountOwed < 0.01) i++;
    if (creditor.amountCredit < 0.01) j++;
  }

  return { totalGroupSpend, memberTotals: Object.values(memberTotals), settlementSummary };
};
exports.computeGroupAnalytics = computeGroupAnalytics;

// @desc    Get group analytics and who owes whom
// @route   GET /api/groups/:id/analytics
// @access  Private (group members only)
exports.getGroupAnalytics = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("members", "name");
    if (!group) return fail(res, 404, "Group not found.");
    if (!isMember(group, req.user.id)) return fail(res, 403, "You are not a member of this group.");

    const expenses = await GroupExpense.find({ group: req.params.id });
    res.status(200).json({ success: true, data: computeGroupAnalytics(group.members, expenses) });
  } catch (error) {
    handleError(res, error);
  }
};
