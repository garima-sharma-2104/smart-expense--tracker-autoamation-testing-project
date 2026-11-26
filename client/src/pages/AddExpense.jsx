import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../utils/api";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment",
  "Bills", "Health", "Education", "Other",
];

function AddExpense() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    description: "",
    isRecurring: false,
    recurrenceInterval: "None",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/expenses", {
        ...form,
        amount: parseFloat(form.amount),
      });
      toast.success("Expense added successfully!");
      navigate("/expenses");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to add expense. Is the server running?"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page add-expense-page fadeUp">
      <div className="page-header">
        <div>
          <h1>Add New Expense</h1>
          <p className="page-header-subtitle">Record a new expense entry</p>
        </div>
        <Link to="/expenses" className="btn btn-secondary">
          ← Back to Expenses
        </Link>
      </div>

      <form className="expense-form dashboard-card max-w-lg mx-auto" onSubmit={handleSubmit} id="add-expense-form" data-testid="expense-form">
        <div className="form-group mb-4">
          <label htmlFor="title" className="form-label">Title *</label>
          <input
            type="text"
            className="form-control"
            id="title"
            data-testid="expense-title"
            name="title"
            placeholder="e.g. Netflix Subscription"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="row mb-4">
          <div className="col-md-6 form-group">
            <label htmlFor="amount" className="form-label">Amount (₹) *</label>
            <input
              type="number"
              className="form-control"
              id="amount"
              data-testid="expense-amount"
              name="amount"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 form-group">
            <label htmlFor="category" className="form-label">Category *</label>
            <select
              className="form-control form-select"
              id="category"
              data-testid="expense-category"
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

        <div className="form-group mb-4">
          <label htmlFor="date" className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            id="date"
            data-testid="expense-date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        {/* Recurring Expense Toggle */}
        <div className="mb-4 p-3 bg-light rounded" style={{ background: "var(--bg-hover) !important", border: "1px solid var(--border)" }}>
          <div className="form-check form-switch mb-2">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="isRecurring" 
              data-testid="expense-recurring"
              name="isRecurring" 
              checked={form.isRecurring} 
              onChange={handleChange} 
            />
            <label className="form-check-label fw-bold" htmlFor="isRecurring">Make this a recurring expense</label>
          </div>
          
          {form.isRecurring && (
            <div className="mt-3 animate-fade-in">
              <label htmlFor="recurrenceInterval" className="form-label">How often?</label>
              <select
                className="form-control form-select"
                id="recurrenceInterval"
                data-testid="expense-interval"
                name="recurrenceInterval"
                value={form.recurrenceInterval}
                onChange={handleChange}
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-group mb-4">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            className="form-control"
            id="description"
            data-testid="expense-description"
            name="description"
            placeholder="Optional notes about this expense..."
            rows="3"
            value={form.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={submitting} id="submit-expense-btn" data-testid="expense-submit">
          {submitting ? "Adding..." : "Add Expense"}
        </button>
      </form>
    </div>
  );
}

export default AddExpense;
