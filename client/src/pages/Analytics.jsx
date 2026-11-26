import { useState, useEffect } from "react";
import API from "../utils/api";
import SkeletonLoader from "../components/SkeletonLoader";

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await API.get("/expenses/analytics/summary");
      setData(res.data.data);
    } catch (err) {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fadeUp">
        <h2 className="mb-4">Smart Analytics</h2>
        <SkeletonLoader type="stat-cards" />
      </div>
    );
  }

  if (error) {
    return <p className="error-msg" role="alert" data-testid="analytics-error">{error}</p>;
  }

  const { currentMonthTotal, prevMonthTotal, percentChange, highestCategory, highestCategoryAmount, averageDaily } = data;
  const isIncrease = Number(percentChange) > 0;

  return (
    <div className="fadeUp">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Smart Analytics</h2>
          <p className="dashboard-subtitle">Insights into your spending habits</p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Comparison Card */}
        <div className="col-md-4">
          <div className="dashboard-card h-100">
            <h4 className="card-title text-muted">Month-over-Month</h4>
            <div className="mt-4">
              <h2 className="mb-1" data-testid="analytics-current-month">₹{currentMonthTotal.toFixed(2)}</h2>
              <p data-testid="analytics-change" className={`mb-3 ${isIncrease ? "text-danger" : "text-success"}`}>
                {isIncrease ? "↑" : "↓"} {Math.abs(percentChange)}% {isIncrease ? "more" : "less"} than last month
              </p>
              <div className="d-flex justify-content-between fs-7 text-muted border-top pt-3">
                <span>Last Month</span>
                <span data-testid="analytics-prev-month">₹{prevMonthTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Highest Category Card */}
        <div className="col-md-4">
          <div className="dashboard-card h-100">
            <h4 className="card-title text-muted">Top Spending Category</h4>
            <div className="mt-4 text-center">
              <div className="mb-3">
                <span className="user-avatar mx-auto mb-2" style={{ background: "var(--primary-light)" }}>
                  🏆
                </span>
                <h3 className="mb-1" data-testid="analytics-top-category">{highestCategory}</h3>
              </div>
              <h4 className="text-primary" data-testid="analytics-top-category-amount">₹{highestCategoryAmount.toFixed(2)}</h4>
              <p className="text-muted fs-7 mt-3">This month's highest outflow</p>
            </div>
          </div>
        </div>

        {/* Daily Average Card */}
        <div className="col-md-4">
          <div className="dashboard-card h-100">
            <h4 className="card-title text-muted">Average Daily Spend</h4>
            <div className="mt-4">
              <h2 className="mb-1" data-testid="analytics-average-daily">₹{averageDaily}</h2>
              <p className="text-muted">Per day this month</p>
              <div className="progress mt-4" style={{ height: "6px" }}>
                <div className="progress-bar bg-info" style={{ width: "100%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
