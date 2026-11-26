import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import SkeletonLoader from "../components/SkeletonLoader";

const INCOME_CATEGORY_COLORS = {
  Salary: "#10b981",
  Freelance: "#6366f1",
  Business: "#f59e0b",
  Investment: "#3b82f6",
  Rental: "#8b5cf6",
  Gift: "#ec4899",
  Refund: "#06b6d4",
  Other: "#6b7280",
};

const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Business", "Investment",
  "Rental", "Gift", "Refund", "Other",
];

function Income() {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    source: "",
    amount: "",
    category: "Salary",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      const res = await API.get("/income");
      setIncomes(res.data.data);
    } catch (err) {
      setError("Failed to fetch income data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await API.post("/income", {
        ...form,
        amount: parseFloat(form.amount),
      });
      setIncomes([res.data.data, ...incomes]);
      setForm({
        source: "",
        amount: "",
        category: "Salary",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add income.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this income entry?")) return;
    setDeletingId(id);
    try {
      await API.delete(`/income/${id}`);
      setIncomes(incomes.filter((inc) => inc._id !== id));
    } catch (err) {
      setError("Failed to delete income.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  if (loading) {
    return (
      <div className="page income-page">
        <div className="page-header">
          <div>
            <div className="skeleton skeleton-text-lg" style={{ width: "180px" }}></div>
            <div className="skeleton skeleton-text-sm" style={{ width: "140px", marginTop: "8px" }}></div>
          </div>
          <div className="skeleton skeleton-block" style={{ width: "130px", height: "40px" }}></div>
        </div>
        <SkeletonLoader type="expense-list" count={4} />
      </div>
    );
  }

  return (
    <div className="page income-page">
      <div className="page-header">
        <div>
          <h1>Your Income</h1>
          {incomes.length > 0 && (
            <p className="page-header-subtitle" data-testid="income-summary">
              {incomes.length} source{incomes.length !== 1 ? "s" : ""} · Total: ₹{totalIncome.toFixed(2)}
            </p>
          )}
        </div>
        <button
          className={`btn ${showForm ? "btn-secondary" : "btn-primary"}`}
          onClick={() => setShowForm(!showForm)}
          id="toggle-income-form-btn"
          data-testid="income-toggle-form"
        >
          {showForm ? "✕ Close" : "+ Add Income"}
        </button>
      </div>

      {error && <p className="error-msg" role="alert" data-testid="income-error">{error}</p>}

      {/* Inline Add Income Form */}
      {showForm && (
        <div className="income-form-card">
          <h3 className="income-form-title">Add New Income</h3>
          <form className="expense-form income-inline-form" onSubmit={handleSubmit} id="add-income-form" data-testid="income-form">
            <div className="form-group">
              <label htmlFor="income-source">Source *</label>
              <input
                type="text"
                id="income-source"
                data-testid="income-source"
                name="source"
                placeholder="e.g. Monthly Salary"
                value={form.source}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="income-amount">Amount (₹) *</label>
                <input
                  type="number"
                  id="income-amount"
                  data-testid="income-amount"
                  name="amount"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="income-category">Category *</label>
                <select
                  id="income-category"
                  data-testid="income-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  {INCOME_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="income-date">Date</label>
              <input
                type="date"
                id="income-date"
                data-testid="income-date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="income-description">Description</label>
              <textarea
                id="income-description"
                data-testid="income-description"
                name="description"
                placeholder="Optional notes..."
                rows="2"
                value={form.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-income btn-lg"
              disabled={submitting}
              id="submit-income-btn"
              data-testid="income-submit"
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  Adding...
                </>
              ) : (
                "Add Income"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Income List */}
      {incomes.length === 0 ? (
        <div className="empty-state" data-testid="income-empty">
          <span className="empty-icon">💵</span>
          <h2>No income recorded</h2>
          <p>Start by adding your income sources to track your balance.</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add Your First Income
          </button>
        </div>
      ) : (
        <div className="expenses-list" data-testid="income-list">
          {incomes.map((income, index) => (
            <div
              key={income._id}
              data-testid="income-card"
              data-income-id={income._id}
              className="expense-card income-card-item"
              style={{ animationDelay: `${index * 0.04}s` }}
            >
              <div className="expense-info">
                <span
                  className="category-badge"
                  style={{
                    backgroundColor: INCOME_CATEGORY_COLORS[income.category] || "#6b7280",
                  }}
                >
                  {income.category}
                </span>
                <h3 data-testid="income-card-source">{income.source}</h3>
                {income.description && (
                  <p className="expense-desc">{income.description}</p>
                )}
                <span className="expense-date">{formatDate(income.date)}</span>
              </div>
              <div className="expense-actions">
                <span className="expense-amount income-amount-text" data-testid="income-card-amount">
                  +₹{income.amount.toFixed(2)}
                </span>
                <button
                  className="btn btn-danger btn-sm"
                  data-testid="income-delete-button"
                  onClick={() => handleDelete(income._id)}
                  disabled={deletingId === income._id}
                >
                  {deletingId === income._id ? "..." : "🗑️ Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Income;
