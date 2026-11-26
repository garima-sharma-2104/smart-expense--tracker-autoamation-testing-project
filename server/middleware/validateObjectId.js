const { isValidId } = require("../utils/validators");
const { fail } = require("../utils/respond");

/** Reject malformed :id params with 400 instead of a database CastError / 500. */
const validateObjectId = (req, res, next) => {
  if (!isValidId(req.params.id)) return fail(res, 400, "Invalid ID format");
  next();
};

module.exports = { validateObjectId };
