import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const Settings = () => {
  const { user, updateBudget } = useAuth();
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.monthlyBudget !== undefined) {
      setBudget(user.monthlyBudget);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateBudget(Number(budget));
      toast.success("Budget updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fadeUp">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Settings</h2>
      </div>

      <div className="card max-w-lg">
        <div className="card-body p-4">
          <h4 className="mb-4">Financial Goals</h4>
          <form onSubmit={handleSubmit} data-testid="budget-form">
            <div className="mb-4">
              <label className="form-label" htmlFor="monthly-budget">Monthly Budget Limit (₹)</label>
              <div className="input-group">
                <span className="input-group-text">₹</span>
                <input
                  type="number"
                  id="monthly-budget"
                  data-testid="budget-input"
                  className="form-control form-control-lg"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <small className="text-muted d-block mt-2">
                We'll notify you when your expenses exceed this monthly limit.
                Set to 0 to disable tracking.
              </small>
            </div>
            <button
              type="submit"
              data-testid="budget-submit"
              className="btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Preferences"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
