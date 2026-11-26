const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { fail } = require("../utils/respond");

/** Require a valid "Authorization: Bearer <jwt>" header and attach req.user. */
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return fail(res, 401, "Not authorized, no token provided");
  }
  const token = header.split(" ")[1];
  if (!token) return fail(res, 401, "Not authorized, no token provided");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return fail(res, 401, "Not authorized, token invalid");
  }

  try {
    req.user = await User.findById(decoded.id).select("-password");
  } catch (error) {
    console.error("Auth middleware database error:", error.message);
    return fail(res, 500, "Server error");
  }
  if (!req.user) return fail(res, 401, "User not found");
  next();
};

module.exports = { protect };
