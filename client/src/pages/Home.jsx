import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="page home-page">
      <div className="hero">
        <div className="hero-badge">✨ Smart Financial Tracking</div>
        <h1>Smart Expense Tracker</h1>
        <p className="subtitle">
          Take control of your finances with intelligent expense tracking,
          categorized insights, and beautiful analytics.
        </p>
        <div className="hero-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                📊 Dashboard
              </Link>
              <Link to="/add" className="btn btn-secondary btn-lg">
                + Add Expense
              </Link>
            </>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">
                Get Started Free →
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <span className="feature-icon">📊</span>
          <h3>Track Spending</h3>
          <p>Monitor where your money goes with categorized expense logging and rich visualizations.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🔒</span>
          <h3>Secure & Private</h3>
          <p>Your data is protected with JWT authentication. Only you can access your financial data.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📈</span>
          <h3>Smart Insights</h3>
          <p>Get visual breakdowns, trends, and savings rate analysis of your spending habits.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
