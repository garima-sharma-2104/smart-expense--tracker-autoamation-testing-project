import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Papa from "papaparse";
import API from "../utils/api";
import SkeletonLoader from "../components/SkeletonLoader";

const CATEGORY_COLORS = {
  Food: "#ef4444",
  Transport: "#3b82f6",
  Shopping: "#f59e0b",
  Entertainment: "#8b5cf6",
  Bills: "#10b981",
  Health: "#ec4899",
  Education: "#06b6d4",
  Other: "#6b7280",
};

const CATEGORIES = [
  "All", "Food", "Transport", "Shopping",
  "Entertainment", "Bills", "Health", "Education", "Other",
];

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.append("category", category);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (minAmount) params.append("minAmount", minAmount);
      if (maxAmount) params.append("maxAmount", maxAmount);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

      const queryString = params.toString();
      const url = queryString ? `/expenses?${queryString}` : "/expenses";

      const res = await API.get(url);
      setExpenses(res.data.data);
    } catch (err) {
      setError("Failed to fetch expenses. Is the server running?");
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [category, startDate, endDate, minAmount, maxAmount, debouncedSearch]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    setDeletingId(id);
    try {
      await API.delete(`/expenses/${id}`);
      setExpenses(expenses.filter((exp) => exp._id !== id));
      toast.success("Expense deleted");
    } catch (err) {
      toast.error("Failed to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    if (expenses.length === 0) {
      toast.info("No data to export.");
      return;
    }
    const csvData = expenses.map(e => ({
      Title: e.title,
      Amount: e.amount,
      Category: e.category,
      Date: new Date(e.date).toLocaleDateString(),
      Recurring: e.isRecurring ? "Yes" : "No",
      Description: e.description || "",
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const filename = `expenses-export-${new Date().toISOString().split("T")[0]}.csv`;
    if (navigator.msSaveBlob) { 
      navigator.msSaveBlob(blob, filename);
    } else {
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast.success("Export successful");
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  };

  const hasActiveFilters =
    category !== "All" || startDate || endDate || minAmount || maxAmount || debouncedSearch.trim();

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="page expenses-page fadeUp">
      <div className="page-header">
        <div>
          <h1>Your Expenses</h1>
          <p className="page-header-subtitle" data-testid="expenses-summary">
            {loading
              ? "Loading your expenses..."
              : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} · Total: ₹${totalSpent.toFixed(2)}`}
            {hasActiveFilters && " (filtered)"}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleExport} data-testid="export-csv" className="btn btn-outline-primary" style={{ background: "transparent", color: "var(--primary)", borderColor: "var(--primary)" }}>
            📥 Export CSV
          </button>
          <Link to="/add" className="btn btn-primary" id="add-expense-btn" data-testid="add-expense-link">
            + Add Expense
          </Link>
        </div>
      </div>

      {/* ===== Search & Filter Bar ===== */}
      <div className="filter-bar" id="expense-filters">
        <div className="filter-search-row">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              id="expense-search"
              data-testid="expense-search"
              className="search-input"
              placeholder="Search by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button
            data-testid="filter-toggle"
            className={`btn btn-filter-toggle ${filtersOpen ? "active" : ""}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <span className="filter-icon">⚙️</span>
            Filters
            {hasActiveFilters && <span className="filter-dot"></span>}
          </button>
        </div>

        {filtersOpen && (
          <div className="filter-panel">
            <div className="filter-group">
              <label htmlFor="filter-category">Category</label>
              <select
                id="filter-category"
                data-testid="filter-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="filter-start-date">From Date</label>
              <input
                type="date"
                id="filter-start-date"
                data-testid="filter-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filter-end-date">To Date</label>
              <input
                type="date"
                id="filter-end-date"
                data-testid="filter-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filter-min-amount">Min Amount (₹)</label>
              <input
                type="number"
                id="filter-min-amount"
                data-testid="filter-min-amount"
                min="0"
                value={minAmount}
                placeholder="e.g. 50"
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filter-max-amount">Max Amount (₹)</label>
              <input
                type="number"
                id="filter-max-amount"
                data-testid="filter-max-amount"
                min="0"
                value={maxAmount}
                placeholder="e.g. 1000"
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <button className="btn btn-clear-filters" onClick={clearFilters} data-testid="clear-filters">
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="filter-tags">
            {category !== "All" && (
              <span className="filter-tag">
                {category}
                <button onClick={() => setCategory("All")}>✕</button>
              </span>
            )}
            {startDate && (
              <span className="filter-tag">
                From: {startDate}
                <button onClick={() => setStartDate("")}>✕</button>
              </span>
            )}
            {endDate && (
              <span className="filter-tag">
                To: {endDate}
                <button onClick={() => setEndDate("")}>✕</button>
              </span>
            )}
            {minAmount && (
              <span className="filter-tag">
                Min: ₹{minAmount}
                <button onClick={() => setMinAmount("")}>✕</button>
              </span>
            )}
            {maxAmount && (
              <span className="filter-tag">
                Max: ₹{maxAmount}
                <button onClick={() => setMaxAmount("")}>✕</button>
              </span>
            )}
            {debouncedSearch.trim() && (
              <span className="filter-tag">
                "{debouncedSearch}"
                <button onClick={() => setSearch("")}>✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {error && <p className="error-msg" role="alert" data-testid="expenses-error">{error}</p>}

      {/* ===== Expense List ===== */}
      {loading ? (
        <SkeletonLoader type="expense-list" count={5} />
      ) : expenses.length === 0 ? (
        <div className="empty-state" data-testid="expenses-empty">
          <span className="empty-icon">{hasActiveFilters ? "🔍" : "💸"}</span>
          <h2>{hasActiveFilters ? "No matching expenses" : "No expenses yet"}</h2>
          <p>
            {hasActiveFilters
              ? "Try adjusting your filters or search term."
              : "Start tracking your spending by adding your first expense."}
          </p>
          {hasActiveFilters ? (
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          ) : (
            <Link to="/add" className="btn btn-primary">
              Add Your First Expense
            </Link>
          )}
        </div>
      ) : (
        <div className="expenses-list" data-testid="expenses-list">
          {expenses.map((expense, index) => (
            <div
              key={expense._id}
              data-testid="expense-card"
              data-expense-id={expense._id}
              className="expense-card"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div className="expense-info">
                <span
                  className="category-badge"
                  data-testid="expense-card-category"
                  style={{
                    backgroundColor: CATEGORY_COLORS[expense.category] || "#6b7280",
                  }}
                >
                  {expense.category}
                </span>
                <h3 data-testid="expense-card-title">
                  {expense.title}
                  {expense.isRecurring && <span title="Recurring Expense" style={{marginLeft: '8px', fontSize: '0.8em'}}>🔄</span>}
                </h3>
                {expense.description && (
                  <p className="expense-desc">{expense.description}</p>
                )}
                <span className="expense-date">{formatDate(expense.date)}</span>
              </div>
              <div className="expense-actions">
                <span className="expense-amount" data-testid="expense-card-amount">
                  ₹{expense.amount.toFixed(2)}
                </span>
                <div className="expense-btns">
                  <Link
                    to={`/edit/${expense._id}`}
                    data-testid="expense-edit-link"
                    className="btn btn-edit btn-sm"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    data-testid="expense-delete-button"
                    onClick={() => handleDelete(expense._id)}
                    disabled={deletingId === expense._id}
                  >
                    {deletingId === expense._id ? "..." : "🗑️ Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Expenses;
