const Income = require("../models/Income");
const { fail, handleError } = require("../utils/respond");
const { validateEntry, INCOME_CFG } = require("../utils/validators");

// @desc    Get all income entries for logged-in user
// @route   GET /api/income
const getIncomes = async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.user._id }).sort({ date: -1 });
    res.json({ success: true, count: incomes.length, data: incomes });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Add a new income entry
// @route   POST /api/income
const addIncome = async (req, res) => {
  try {
    const { errors, data } = validateEntry(req.body, INCOME_CFG);
    if (errors.length) return fail(res, 400, errors.join(", "), errors);
    const income = await Income.create({ ...data, user: req.user._id });
    res.status(201).json({ success: true, data: income });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get a single income entry (owner only)
// @route   GET /api/income/:id
const getIncome = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, user: req.user._id });
    if (!income) return fail(res, 404, "Income not found");
    res.json({ success: true, data: income });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update an income entry (owner only; only whitelisted fields)
// @route   PUT /api/income/:id
const updateIncome = async (req, res) => {
  try {
    const { errors, data } = validateEntry(req.body, INCOME_CFG, { partial: true });
    if (errors.length) return fail(res, 400, errors.join(", "), errors);
    const income = await Income.findOne({ _id: req.params.id, user: req.user._id });
    if (!income) return fail(res, 404, "Income not found");
    income.set(data);
    await income.save();
    res.json({ success: true, data: income });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete an income entry (owner only)
// @route   DELETE /api/income/:id
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!income) return fail(res, 404, "Income not found");
    res.json({ success: true, data: {} });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { getIncomes, addIncome, getIncome, updateIncome, deleteIncome };
