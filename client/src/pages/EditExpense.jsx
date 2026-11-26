import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";
import SkeletonLoader from "../components/SkeletonLoader";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment",
  "Bills", "Health", "Education", "Other",
];

function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Other",
    date: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    try {
      const res = await API.get(`/expenses/${id}`);
      const exp = res.data.data;
      setForm({
        title: exp.title,
        amount: exp.amount.toString(),
        category: exp.category,
        date: new Date(exp.date).toISOString().split("T")[0],
        description: exp.description || "",
      });
    } catch (err) {
      setError("Failed to load expense. It may have been deleted.");
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
      await API.put(`/expenses/${id}`, {
        ...form,
        amount: parseFloat(form.amount),
      });
      navigate("/expenses");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update expense."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page add-expense-page">
        <div className="page-header">
          <div>
            <div className="skeleton skeleton-text-lg" style={{ width: "200px" }}></div>
            <div className="skeleton skeleton-text-sm" style={{ width: "160px", marginTop: "8px" }}></div>
          </div>
        </div>
        <div className="expense-form" style={{ pointerEvents: "none" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="form-group">
              <div className="skeleton skeleton-text-sm" style={{ width: "80px" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "44px" }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page add-expense-page">
      <div className="page-header">
        <div>
          <h1>Edit Expense</h1>
          <p className="page-header-subtitle">Update expense details</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/expenses")}
        >
          ← Back to Expenses
        </button>
      </div>

      {error && <p className="error-msg" role="alert" data-testid="edit-expense-error">{error}</p>}

      <form className="expense-form" onSubmit={handleSubmit} id="edit-expense-form" data-testid="edit-expense-form">
        <div className="form-group">
          <label htmlFor="edit-title">Title *</label>
          <input
            type="text"
            id="edit-title"
            data-testid="edit-expense-title"
            name="title"
            placeholder="e.g. Lunch at cafe"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="edit-amount">Amount (₹) *</label>
            <input
              type="number"
              id="edit-amount"
              data-testid="edit-expense-amount"
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
            <label htmlFor="edit-category">Category *</label>
            <select
              id="edit-category"
              data-testid="edit-expense-category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="edit-date">Date</label>
          <input
            type="date"
            id="edit-date"
            data-testid="edit-expense-date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-description">Description</label>
          <textarea
            id="edit-description"
            data-testid="edit-expense-description"
            name="description"
            placeholder="Optional notes about this expense..."
            rows="3"
            value={form.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
            id="save-expense-btn"
            data-testid="edit-expense-submit"
          >
            {submitting ? (
              <>
                <span className="btn-spinner"></span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => navigate("/expenses")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditExpense;
