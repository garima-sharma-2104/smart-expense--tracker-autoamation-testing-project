const Expense = require("../models/Expense");
const { fail, handleError } = require("../utils/respond");
const {
  validateEntry, EXPENSE_CFG, EXPENSE_CATEGORIES, escapeRegex, advanceDate,
  isValidDate, toNumber,
} = require("../utils/validators");


// @desc    Get all expenses for logged-in user (with optional filters)
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const q = req.query;
    const query = { user: req.user._id };
    const str = (v) => (typeof v === "string" ? v : undefined);

    const category = str(q.category);
    if (category && category !== "All") {
      if (!EXPENSE_CATEGORIES.includes(category)) return fail(res, 400, "Invalid category filter");
      query.category = category;
    }

    const startDate = str(q.startDate);
    const endDate = str(q.endDate);
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        if (!isValidDate(startDate)) return fail(res, 400, "Invalid startDate");
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        if (!isValidDate(endDate)) return fail(res, 400, "Invalid endDate");
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const minAmount = str(q.minAmount);
    const maxAmount = str(q.maxAmount);
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) {
        const n = toNumber(minAmount);
        if (Number.isNaN(n)) return fail(res, 400, "Invalid minAmount");
        query.amount.$gte = n;
      }
      if (maxAmount) {
        const n = toNumber(maxAmount);
        if (Number.isNaN(n)) return fail(res, 400, "Invalid maxAmount");
        query.amount.$lte = n;
      }
    }

    const search = str(q.search);
    if (search) {
      if (search.length > 100) return fail(res, 400, "Search text is too long");
      const searchRegex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { errors, data } = validateEntry(req.body, EXPENSE_CFG);
    if (errors.length) return fail(res, 400, errors.join(", "), errors);

    const expenseData = { ...data, user: req.user._id };
    if (expenseData.isRecurring) {
      expenseData.nextDueDate = advanceDate(expenseData.date || new Date(), expenseData.recurrenceInterval);
    } else {
      expenseData.isRecurring = false;
      expenseData.recurrenceInterval = "None";
    }

    const expense = await Expense.create(expenseData);
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get a single expense (owner only)
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return fail(res, 404, "Expense not found");
    res.json({ success: true, data: expense });
  } catch (error) {
    handleError(res, error);
  }
};

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

// @desc    Update an expense (owner only; only whitelisted fields)
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const { errors, data } = validateEntry(req.body, EXPENSE_CFG, { partial: true });
    if (errors.length) return fail(res, 400, errors.join(", "), errors);

    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return fail(res, 404, "Expense not found");

    const before = {
      isRecurring: expense.isRecurring,
      interval: expense.recurrenceInterval,
      date: expense.date,
    };
    expense.set(data);

    // Only recompute the next due date when recurrence settings or the date
    // actually changed; otherwise a plain edit would reset the schedule and
    // cause already-processed occurrences to be generated again.
    const recurrenceChanged =
      expense.isRecurring !== before.isRecurring ||
      expense.recurrenceInterval !== before.interval ||
      (data.date && dayKey(data.date) !== dayKey(before.date));

    if (!expense.isRecurring || expense.recurrenceInterval === "None") {
      expense.isRecurring = false;
      expense.recurrenceInterval = "None";
      expense.nextDueDate = undefined;
    } else if (recurrenceChanged || !expense.nextDueDate) {
      expense.nextDueDate = advanceDate(expense.date, expense.recurrenceInterval);
    }

    await expense.save();
    res.json({ success: true, data: expense });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete an expense (owner only)
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return fail(res, 404, "Expense not found");
    res.json({ success: true, data: {} });
  } catch (error) {
    handleError(res, error);
  }
};

// --- ADVANCED FEATURES ---

// @desc    Get expense analytics (monthly comparison, top category, daily average)
// @route   GET /api/expenses/analytics/summary
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const prevMonthStart = new Date(currentMonthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

    const currentMonthEnd = new Date(currentMonthStart);
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setMilliseconds(-1);

    const expenses = await Expense.find({ user: req.user._id });

    let currentMonthTotal = 0;
    let prevMonthTotal = 0;
    const categoryTotals = {};

    expenses.forEach(exp => {
      const expDate = new Date(exp.date);
      
      // Calculate monthly totals
      if (expDate >= currentMonthStart && expDate <= currentMonthEnd) {
        currentMonthTotal += exp.amount;
      } else if (expDate >= prevMonthStart && expDate < currentMonthStart) {
        prevMonthTotal += exp.amount;
      }

      // Calculate categories (all time or current month - let's do current month)
      if (expDate >= currentMonthStart && expDate <= currentMonthEnd) {
        if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
        categoryTotals[exp.category] += exp.amount;
      }
    });

    // Find highest spending category
    let highestCategory = "None";
    let highestCategoryAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > highestCategoryAmount) {
        highestCategoryAmount = amt;
        highestCategory = cat;
      }
    }

    // Compare with last month
    let percentChange = 0;
    if (prevMonthTotal > 0) {
      percentChange = ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;
    }

    // Average daily expense
    const today = new Date();
    const daysInCurrentMonth = today.getDate(); // Up to today
    const averageDaily = currentMonthTotal / (daysInCurrentMonth || 1);

    res.json({
      success: true,
      data: {
        currentMonthTotal,
        prevMonthTotal,
        percentChange: percentChange.toFixed(1),
        highestCategory,
        highestCategoryAmount,
        averageDaily: averageDaily.toFixed(2)
      }
    });

  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Process pending recurring transactions
// @route   POST /api/expenses/process-recurring
// @access  Private
const processRecurringTransactions = async (req, res) => {
  try {
    const today = new Date();
    const pendingRecurring = await Expense.find({
      user: req.user._id,
      isRecurring: true,
      nextDueDate: { $lte: today },
      recurrenceInterval: { $ne: "None" },
    });

    let processedCount = 0;

    for (const exp of pendingRecurring) {
      let due = exp.nextDueDate;
      while (due && due <= today) {
        const next = advanceDate(due, exp.recurrenceInterval);
        if (!next) break;

        // Atomically claim this occurrence: if a concurrent request (e.g. React
        // StrictMode double-invoking the dashboard effect) already advanced it,
        // the filter no longer matches and we skip, so no duplicates are created.
        const claimed = await Expense.findOneAndUpdate(
          { _id: exp._id, user: req.user._id, nextDueDate: due },
          { nextDueDate: next }
        );
        if (!claimed) break;

        await Expense.create({
          user: exp.user,
          title: `${exp.title} (Recurring)`,
          amount: exp.amount,
          category: exp.category,
          date: due,
          description: "Auto-generated recurring expense",
          isRecurring: false,
        });
        processedCount++;
        due = next;
      }
    }

    res.json({ success: true, message: `Processed ${processedCount} recurring transactions.` });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getExpenses,
  addExpense,
  getExpense,
  updateExpense,
  deleteExpense,
  getAnalytics,
  processRecurringTransactions
};
