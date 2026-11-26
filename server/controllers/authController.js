const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { fail, handleError } = require("../utils/respond");
const { isValidEmail, normalizeEmail, toNumber, MAX_AMOUNT } = require("../utils/validators");

// Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });

const userPayload = (user, withToken) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  monthlyBudget: user.monthlyBudget,
  ...(withToken ? { token: generateToken(user._id) } : {}),
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return fail(res, 400, "Please fill in all fields");
    }
    if ([name, email, password].some((v) => typeof v !== "string")) {
      return fail(res, 400, "Name, email and password must be text");
    }
    if (name.trim().length === 0 || name.trim().length > 50) {
      return fail(res, 400, "Name must be 1-50 characters");
    }
    if (!isValidEmail(email)) return fail(res, 400, "Please add a valid email");
    if (password.length < 6) return fail(res, 400, "Password must be at least 6 characters");
    if (password.length > 72) return fail(res, 400, "Password cannot exceed 72 characters");

    const cleanEmail = normalizeEmail(email);
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return fail(res, 409, "User already exists with this email");
    }

    const user = await User.create({ name: name.trim(), email: cleanEmail, password });
    res.status(201).json({ success: true, data: userPayload(user, true) });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return fail(res, 400, "Please provide email and password");
    }
    if (typeof email !== "string" || typeof password !== "string") {
      return fail(res, 400, "Email and password must be text");
    }

    const user = await User.findOne({ email: normalizeEmail(email) }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return fail(res, 401, "Invalid email or password");
    }

    res.json({ success: true, data: userPayload(user, true) });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return fail(res, 404, "User not found");
    res.json({ success: true, data: userPayload(user, false) });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update user monthly budget
// @route   PUT /api/auth/budget
// @access  Private
const updateBudget = async (req, res) => {
  try {
    const budget = toNumber((req.body || {}).budget);
    if (!Number.isFinite(budget) || budget < 0 || budget > MAX_AMOUNT) {
      return fail(res, 400, "Please provide a valid budget amount");
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { monthlyBudget: budget },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: userPayload(user, false) });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { registerUser, loginUser, getMe, updateBudget };
