/** Consistent JSON error responses: { success:false, message, errors? } */
const fail = (res, status, message, errors) => {
  const body = { success: false, message };
  if (errors && errors.length > 1) body.errors = errors;
  return res.status(status).json(body);
};

/** Map thrown errors to HTTP responses without leaking internals. */
const handleError = (res, error) => {
  if (error && error.name === "ValidationError") {
    const msgs = Object.values(error.errors || {}).map((e) => e.message);
    return fail(res, 400, msgs.join(", ") || "Validation failed", msgs);
  }
  if (error && error.name === "CastError") return fail(res, 400, "Invalid identifier or value");
  if (error && error.code === 11000) return fail(res, 409, "Duplicate value: record already exists");
  console.error("Unhandled error:", error && error.message);
  return fail(res, 500, "Server error");
};

module.exports = { fail, handleError };
