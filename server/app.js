const express = require("express");
const cors = require("cors");

/**
 * Express application (no listen / DB connect here so it can be tested).
 * CORS origins come from CORS_ORIGIN (comma-separated); default is the Vite dev server.
 */
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",").map((s) => s.trim()).filter(Boolean);

const app = express();
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Smart Expense Tracker API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/income", require("./routes/incomeRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));

// Unknown API route -> JSON 404
app.use("/api", (req, res) =>
  res.status(404).json({ success: false, message: "Route not found" })
);

// Malformed JSON bodies and other errors -> JSON, never an HTML stack trace
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError)) {
    return res.status(400).json({ success: false, message: "Malformed JSON body" });
  }
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body too large" });
  }
  console.error("Unhandled error:", err && err.message);
  res.status(500).json({ success: false, message: "Server error" });
});

module.exports = app;
