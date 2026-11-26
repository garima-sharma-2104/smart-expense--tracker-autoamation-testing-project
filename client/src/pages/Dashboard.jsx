import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import API from "../utils/api";
import SkeletonLoader from "../components/SkeletonLoader";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

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

const CATEGORY_ICONS = {
  Food: "🍔",
  Transport: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Bills: "📄",
  Health: "💊",
  Education: "📚",
  Other: "📦",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Process any pending recurring transactions lazily
      await API.post("/expenses/process-recurring").catch(e => console.error("Error processing recurring", e));

      const [expRes, incRes] = await Promise.all([
        API.get("/expenses"),
        API.get("/income"),
      ]);
      setExpenses(expRes.data.data);
      setIncomes(incRes.data.data);
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // ===== Computed Stats =====
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const balance = totalIncome - totalExpenses;
  const expenseCount = expenses.length;

  // Category breakdown (expenses)
  const categoryTotals = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
  }, [expenses]);

  const sortedCategories = useMemo(
    () => Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]),
    [categoryTotals]
  );

  // Income by source
  const incomeByCategory = useMemo(() => {
    return incomes.reduce((acc, inc) => {
      acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
      return acc;
    }, {});
  }, [incomes]);

  const sortedIncomeSources = useMemo(
    () => Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]),
    [incomeByCategory]
  );

  // Monthly data for chart (current year)
  const currentYear = new Date().getFullYear();

  const { monthlyExpenseArr, monthlyIncomeArr } = useMemo(() => {
    const expArr = new Array(12).fill(0);
    const incArr = new Array(12).fill(0);

    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (d.getFullYear() === currentYear) {
        expArr[d.getMonth()] += exp.amount;
      }
    });

    incomes.forEach((inc) => {
      const d = new Date(inc.date);
      if (d.getFullYear() === currentYear) {
        incArr[d.getMonth()] += inc.amount;
      }
    });

    return { monthlyExpenseArr: expArr, monthlyIncomeArr: incArr };
  }, [expenses, incomes, currentYear]);

  // Recent 6 transactions (combined & sorted)
  const allTransactions = useMemo(() => {
    return [
      ...expenses.map((e) => ({ ...e, type: "expense" })),
      ...incomes.map((i) => ({ ...i, type: "income", title: i.source })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [expenses, incomes]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  // ===== Chart.js Configurations =====

  // -- Doughnut (Pie) Chart: Expense by Category --
  const pieData = useMemo(() => {
    const labels = sortedCategories.map(([cat]) => cat);
    const data = sortedCategories.map(([, val]) => val);
    const colors = labels.map((cat) => CATEGORY_COLORS[cat] || "#6b7280");

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: isDark ? "rgba(15, 15, 26, 0.8)" : "rgba(255, 255, 255, 0.9)",
          borderWidth: 2,
          hoverBorderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };
  }, [sortedCategories, isDark]);

  const pieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: isDark ? "#94a3b8" : "#64748b",
          font: { family: "'Inter', sans-serif", size: 12, weight: "500" },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(22, 33, 62, 0.95)" : "rgba(255, 255, 255, 0.95)",
        titleColor: isDark ? "#f8fafc" : "#1e293b",
        bodyColor: isDark ? "#e2e8f0" : "#334155",
        borderColor: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: "'Inter', sans-serif", weight: "600" },
        bodyFont: { family: "'Inter', sans-serif" },
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
            return ` ₹${ctx.parsed.toFixed(2)} (${pct}%)`;
          },
        },
      },
    },
  }), [isDark]);

  // -- Bar Chart: Monthly Income vs Expenses --
  const barData = useMemo(() => {
    return {
      labels: MONTH_NAMES,
      datasets: [
        {
          label: "Income",
          data: monthlyIncomeArr,
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          hoverBackgroundColor: "rgba(52, 211, 153, 0.9)",
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
        {
          label: "Expenses",
          data: monthlyExpenseArr,
          backgroundColor: "rgba(99, 102, 241, 0.7)",
          hoverBackgroundColor: "rgba(129, 140, 248, 0.9)",
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
      ],
    };
  }, [monthlyIncomeArr, monthlyExpenseArr]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          color: isDark ? "rgba(148, 163, 184, 0.06)" : "rgba(148, 163, 184, 0.12)",
          drawBorder: false,
        },
        ticks: {
          color: isDark ? "#64748b" : "#94a3b8",
          font: { family: "'Inter', sans-serif", size: 11, weight: "500" },
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.15)",
          drawBorder: false,
        },
        ticks: {
          color: isDark ? "#64748b" : "#94a3b8",
          font: { family: "'Inter', sans-serif", size: 11 },
          callback: (value) => `₹${value.toLocaleString()}`,
        },
        border: { display: false },
      },
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: isDark ? "#94a3b8" : "#64748b",
          font: { family: "'Inter', sans-serif", size: 12, weight: "500" },
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(22, 33, 62, 0.95)" : "rgba(255, 255, 255, 0.95)",
        titleColor: isDark ? "#f8fafc" : "#1e293b",
        bodyColor: isDark ? "#e2e8f0" : "#334155",
        borderColor: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: "'Inter', sans-serif", weight: "600" },
        bodyFont: { family: "'Inter', sans-serif" },
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
  }), [isDark]);

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="dashboard-header">
          <div>
            <div className="skeleton skeleton-text-lg" style={{ width: "280px" }}></div>
            <div className="skeleton skeleton-text-sm" style={{ width: "200px", marginTop: "10px" }}></div>
          </div>
        </div>
        <SkeletonLoader type="balance" />
        <SkeletonLoader type="stat-cards" />
        <SkeletonLoader type="chart" />
        <SkeletonLoader type="table" count={4} />
      </div>
    );
  }

  return (
    <div className="page dashboard-page" data-testid="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>
            Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="dashboard-subtitle">Here's your financial overview</p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/income" className="btn btn-income-outline">
            + Income
          </Link>
          <Link to="/add" className="btn btn-primary">
            + Expense
          </Link>
        </div>
      </div>

      {error && <p className="error-msg" role="alert" data-testid="dashboard-error">{error}</p>}

      {/* ===== Balance Hero Card ===== */}
      <div className={`balance-hero ${balance >= 0 ? "balance-positive" : "balance-negative"}`}>
        <div className="balance-hero-left">
          <span className="balance-hero-label">Net Balance</span>
          <span className="balance-hero-value" data-testid="balance-net">
            {balance >= 0 ? "+" : ""}₹{Math.abs(balance).toFixed(2)}
          </span>
          <span className="balance-hero-status">
            {balance >= 0
              ? "✅ You're in the green — great job!"
              : "⚠️ Spending exceeds income this period"}
          </span>
        </div>
        <div className="balance-hero-right">
          <div className="balance-mini">
            <span className="balance-mini-icon income-glow">↑</span>
            <div>
              <span className="balance-mini-label">Income</span>
              <span className="balance-mini-value" data-testid="balance-income">₹{totalIncome.toFixed(2)}</span>
            </div>
          </div>
          <div className="balance-mini">
            <span className="balance-mini-icon expense-glow">↓</span>
            <div>
              <span className="balance-mini-label">Expenses</span>
              <span className="balance-mini-value" data-testid="balance-expenses">₹{totalExpenses.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Budget Progress ===== */}
      {user?.monthlyBudget > 0 && (
        <div className="dashboard-card mb-4" data-testid="budget-card">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h4 className="mb-0">Monthly Budget (<span className="text-primary" data-testid="budget-amount">₹{user.monthlyBudget}</span>)</h4>
            <Link to="/settings" className="text-muted text-decoration-none">Edit</Link>
          </div>
          <div className="progress" style={{ height: "20px", background: "var(--bg-hover)" }}>
            {(() => {
              // Calculate current month expenses
              const currentYear = new Date().getFullYear();
              const currentMonth = new Date().getMonth();
              const currentMonthExpenses = expenses.reduce((sum, exp) => {
                const d = new Date(exp.date);
                if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
                  return sum + exp.amount;
                }
                return sum;
              }, 0);
              
              const pct = Math.min((currentMonthExpenses / user.monthlyBudget) * 100, 100);
              let bgColor = "var(--primary)";
              if (pct > 85) bgColor = "#f59e0b"; // Warning Orange
              if (pct > 95) bgColor = "#ef4444"; // Danger Red
              
              return (
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated" 
                  data-testid="budget-progress-bar"
                  data-percent={pct.toFixed(1)}
                  role="progressbar" 
                  style={{ width: `${pct}%`, background: bgColor }}
                >
                  {pct >= 10 ? `${pct.toFixed(1)}%` : ""}
                </div>
              );
            })()}
          </div>
          <div className="d-flex justify-content-between mt-2 fs-7 text-muted">
             <span>0</span>
             <span>Current Month Expenses vs Budget</span>
             <span>100%</span>
          </div>
        </div>
      )}

      {/* ===== Stat Cards ===== */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.15)" }}>
            💵
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Income</span>
            <span className="stat-value stat-income" data-testid="stat-total-income">₹{totalIncome.toFixed(2)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(239, 68, 68, 0.15)" }}>
            💸
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value stat-expense" data-testid="stat-total-expenses">₹{totalExpenses.toFixed(2)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(6, 182, 212, 0.15)" }}>
            📝
          </div>
          <div className="stat-content">
            <span className="stat-label">Transactions</span>
            <span className="stat-value" data-testid="stat-transactions">{expenseCount + incomes.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.15)" }}>
            📊
          </div>
          <div className="stat-content">
            <span className="stat-label">Savings Rate</span>
            <span className="stat-value stat-value-sm" data-testid="stat-savings-rate">
              {totalIncome > 0
                ? `${((balance / totalIncome) * 100).toFixed(1)}%`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ===== Chart.js Charts Row ===== */}
      <div className="dashboard-grid">
        {/* Bar Chart: Monthly Income vs Expenses */}
        <div className="dashboard-card">
          <h3 className="card-title">Monthly Overview ({currentYear})</h3>
          <div className="chart-container" id="monthly-bar-chart" data-testid="monthly-bar-chart">
            {monthlyIncomeArr.some((v) => v > 0) || monthlyExpenseArr.some((v) => v > 0) ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <p className="card-empty">No data for this year yet.</p>
            )}
          </div>
        </div>

        {/* Doughnut Chart: Category-wise Expenses */}
        <div className="dashboard-card">
          <h3 className="card-title">Expenses by Category</h3>
          <div className="chart-container chart-container-pie" id="category-pie-chart" data-testid="category-pie-chart">
            {sortedCategories.length > 0 ? (
              <Doughnut data={pieData} options={pieOptions} />
            ) : (
              <p className="card-empty">No expenses recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ===== Income Sources + Recent Transactions ===== */}
      <div className="dashboard-grid">
        {/* Income Sources */}
        <div className="dashboard-card">
          <div className="card-title-row">
            <h3 className="card-title">Income Sources</h3>
            <Link to="/income" className="card-link">Manage →</Link>
          </div>
          {sortedIncomeSources.length === 0 ? (
            <p className="card-empty">
              No income recorded.{" "}
              <Link to="/income" className="auth-link">Add income</Link>
            </p>
          ) : (
            <div className="category-list">
              {sortedIncomeSources.map(([cat, total]) => {
                const pct = totalIncome > 0 ? (total / totalIncome) * 100 : 0;
                return (
                  <div key={cat} className="category-row">
                    <div className="category-row-header">
                      <span className="category-row-name">{cat}</span>
                      <span className="category-row-amount">
                        ₹{total.toFixed(2)}
                        <span className="category-pct">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="category-bar-track">
                      <div
                        className="category-bar-fill"
                        style={{ width: `${pct}%`, background: "#10b981" }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="dashboard-card">
          <div className="card-title-row">
            <h3 className="card-title">Recent Activity</h3>
            <Link to="/expenses" className="card-link">View All →</Link>
          </div>
          {allTransactions.length === 0 ? (
            <p className="card-empty">No transactions yet.</p>
          ) : (
            <div className="recent-table-wrapper">
              <table className="recent-table" id="recent-transactions-table" data-testid="recent-transactions-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((txn) => (
                    <tr key={txn._id}>
                      <td className="table-title">{txn.title}</td>
                      <td>
                        <span
                          className={`type-badge ${
                            txn.type === "income" ? "type-income" : "type-expense"
                          }`}
                        >
                          {txn.type === "income" ? "↑ Income" : "↓ Expense"}
                        </span>
                      </td>
                      <td className="table-date">{formatDate(txn.date)}</td>
                      <td
                        className={`table-amount text-right ${
                          txn.type === "income" ? "amount-green" : "amount-red"
                        }`}
                      >
                        {txn.type === "income" ? "+" : "-"}₹{txn.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
