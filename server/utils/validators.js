/**
 * Pure validation helpers (no database access) so they can be unit-tested
 * without MongoDB. Controllers use these to validate input on the server.
 */
const EXPENSE_CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment",
  "Bills", "Health", "Education", "Other",
];
const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Business", "Investment",
  "Rental", "Gift", "Refund", "Other",
];
const RECURRENCE_INTERVALS = ["Weekly", "Monthly", "Yearly"];
const MAX_AMOUNT = 1e9;

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

/** 24-character hex string (MongoDB ObjectId format). */
const isValidId = (v) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

/** Convert number / numeric string to a finite number, otherwise NaN. */
const toNumber = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
};

/** Amount for a transaction: must be > 0 and <= MAX_AMOUNT. */
const isValidAmount = (n) => Number.isFinite(n) && n > 0 && n <= MAX_AMOUNT;

const isValidEmail = (v) =>
  typeof v === "string" && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const normalizeEmail = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

const isValidDate = (v) => {
  if (v === undefined || v === null || v === "") return false;
  if (typeof v !== "string" && typeof v !== "number") return false;
  return !Number.isNaN(new Date(v).getTime());
};

/** Escape user text before using it inside a RegExp (prevents ReDoS / invalid regex). */
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Advance a due date by one recurrence step. Returns null for unknown interval. */
const advanceDate = (date, interval) => {
  const next = new Date(date);
  if (interval === "Weekly") next.setDate(next.getDate() + 7);
  else if (interval === "Monthly") next.setMonth(next.getMonth() + 1);
  else if (interval === "Yearly") next.setFullYear(next.getFullYear() + 1);
  else return null;
  return next;
};

/**
 * Validate an expense / income request body.
 * cfg.textField  -> "title" (expense) or "source" (income)
 * cfg.categories -> allowed category list
 * cfg.recurring  -> also validate isRecurring / recurrenceInterval
 * partial=true   -> only validate fields that are present (updates)
 * Returns { errors: string[], data: object } where data only has whitelisted fields.
 */
const validateEntry = (body, cfg, { partial = false } = {}) => {
  const errors = [];
  const data = {};
  const src = body && typeof body === "object" ? body : {};
  const has = (k) => src[k] !== undefined;
  const label = cfg.textField === "title" ? "Title" : "Source";

  if (!partial || has(cfg.textField)) {
    const v = src[cfg.textField];
    if (!isNonEmptyString(v)) errors.push(`${label} is required`);
    else if (v.trim().length > 100) errors.push(`${label} cannot exceed 100 characters`);
    else data[cfg.textField] = v.trim();
  }

  if (!partial || has("amount")) {
    const n = toNumber(src.amount);
    if (src.amount === undefined || src.amount === null || src.amount === "") errors.push("Amount is required");
    else if (!isValidAmount(n)) errors.push(`Amount must be a number greater than 0 and at most ${MAX_AMOUNT}`);
    else data.amount = n;
  }

  if (has("category")) {
    if (!cfg.categories.includes(src.category)) {
      errors.push(`Category must be one of: ${cfg.categories.join(", ")}`);
    } else data.category = src.category;
  } else if (!partial) {
    data.category = "Other";
  }

  if (has("date") && src.date !== "") {
    if (!isValidDate(src.date)) errors.push("Date is invalid");
    else data.date = new Date(src.date);
  }

  if (has("description")) {
    if (typeof src.description !== "string") errors.push("Description must be text");
    else if (src.description.length > 500) errors.push("Description cannot exceed 500 characters");
    else data.description = src.description.trim();
  }

  if (cfg.recurring) {
    if (has("isRecurring")) {
      if (typeof src.isRecurring !== "boolean") errors.push("isRecurring must be true or false");
      else data.isRecurring = src.isRecurring;
    }
    if (has("recurrenceInterval")) {
      if (![...RECURRENCE_INTERVALS, "None"].includes(src.recurrenceInterval)) {
        errors.push("recurrenceInterval must be Weekly, Monthly, Yearly or None");
      } else data.recurrenceInterval = src.recurrenceInterval;
    }
    if (data.isRecurring === true && !RECURRENCE_INTERVALS.includes(data.recurrenceInterval)) {
      errors.push("A recurring expense needs a recurrenceInterval of Weekly, Monthly or Yearly");
    }
  }

  return { errors, data };
};

const EXPENSE_CFG = { textField: "title", categories: EXPENSE_CATEGORIES, recurring: true };
const INCOME_CFG = { textField: "source", categories: INCOME_CATEGORIES, recurring: false };

module.exports = {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, RECURRENCE_INTERVALS, MAX_AMOUNT,
  EXPENSE_CFG, INCOME_CFG,
  isNonEmptyString, isValidId, toNumber, isValidAmount, isValidEmail,
  normalizeEmail, isValidDate, escapeRegex, advanceDate, validateEntry,
};
