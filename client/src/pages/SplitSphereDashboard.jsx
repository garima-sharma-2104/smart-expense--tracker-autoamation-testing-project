import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../utils/api";
import SkeletonLoader from "../components/SkeletonLoader";
import { Bar } from "react-chartjs-2";
import { useAuth } from "../context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function SplitSphereDashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [groupData, setGroupData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "Other",
  });

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  const fetchDashboardData = async () => {
    try {
      const [detailsRes, analyticsRes] = await Promise.all([
        API.get(`/groups/${id}`),
        API.get(`/groups/${id}/analytics`),
      ]);
      setGroupData(detailsRes.data.data.group);
      setExpenses(detailsRes.data.data.expenses);
      setAnalytics(analyticsRes.data.data);
    } catch (err) {
      toast.error("Failed to load group dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/groups/${id}/members`, { email: newMemberEmail });
      toast.success("Member added successfully!");
      setNewMemberEmail("");
      fetchDashboardData(); // refresh
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding member");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/groups/${id}/expenses`, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        // By default, paid by current user, split amongst all. (V1 requirement)
      });
      toast.success("Group expense recorded!");
      setExpenseForm({ title: "", amount: "", category: "Other" });
      fetchDashboardData(); // refresh
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding expense");
    }
  };

  // Setup Chart Data
  const barData = useMemo(() => {
    if (!analytics) return null;
    return {
      labels: analytics.memberTotals.map(m => m.name.split(" ")[0]),
      datasets: [
        {
          label: "Total Paid",
          data: analytics.memberTotals.map(m => m.totalPaid),
          backgroundColor: "rgba(99, 102, 241, 0.7)",
          hoverBackgroundColor: "rgba(129, 140, 248, 0.9)",
          borderRadius: 4,
        },
      ],
    };
  }, [analytics]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  if (loading) return <div className="page p-4"><SkeletonLoader type="stat-cards" /></div>;
  if (!groupData) return <div className="page p-4"><h3 data-testid="group-not-found">Group not found</h3></div>;

  return (
    <div className="page fadeUp">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0 text-primary" data-testid="group-title">{groupData.name}</h1>
          <p className="text-muted">SplitSphere Dashboard</p>
        </div>
        <Link to="/groups" className="btn btn-secondary">← Back to Groups</Link>
      </div>

      <div className="row g-4 mb-4">
        {/* Total Group Spend Card */}
        <div className="col-md-4">
          <div className="dashboard-card h-100 text-center">
            <h4 className="card-title text-muted">Total Group Outflow</h4>
            <div className="mt-3">
              <h1 className="text-danger" data-testid="group-total-spend">₹{analytics?.totalGroupSpend?.toFixed(2) || "0.00"}</h1>
              <p className="text-muted fs-7">Sum of all shared expenses</p>
            </div>
          </div>
        </div>

        {/* Member Balances (Who owes Whom) Card */}
        <div className="col-md-8">
          <div className="dashboard-card h-100">
            <h4 className="card-title text-muted mb-3">Settlement Status (Who owes Whom)</h4>
            <div style={{ maxHeight: "150px", overflowY: "auto" }}>
              {analytics?.settlementSummary?.length === 0 ? (
                <div className="alert alert-success text-center" data-testid="settlement-empty">🎉 All debts are settled!</div>
              ) : (
                <ul className="list-group" data-testid="settlement-list">
                  {analytics.settlementSummary.map((s, idx) => (
                    <li key={idx} data-testid="settlement-item" className="list-group-item d-flex justify-content-between align-items-center" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                      <span>
                        <strong className="text-warning">{s.from === user.name ? "You (Owe)" : s.from}</strong> 
                        {" owes "} 
                        <strong className="text-info">{s.to === user.name ? "You (Receive)" : s.to}</strong>
                      </span>
                      <span className="badge bg-danger rounded-pill fs-6">₹{s.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Analytics Chart + Add Member */}
        <div className="col-lg-7">
          <div className="dashboard-card mb-4" style={{ height: "300px" }}>
            <h4 className="card-title text-muted">Spending Contribution</h4>
            {barData && <div className="chart-container h-100 pb-4"><Bar data={barData} options={barOptions} /></div>}
          </div>

          <div className="dashboard-card border-primary">
            <h5 className="mb-3">Invite Member</h5>
            <form onSubmit={handleAddMember} className="d-flex gap-2" data-testid="member-form">
              <input 
                data-testid="member-email-input"
                type="email" 
                className="form-control" 
                placeholder="User's email address..." 
                value={newMemberEmail} 
                onChange={(e) => setNewMemberEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-outline-primary" data-testid="add-member-button">Add</button>
            </form>
            <div className="mt-3">
              <span className="text-muted fs-7">Current Members: </span>
              {groupData.members.map(m => (
                <span key={m._id} className="badge bg-secondary me-1" data-testid="member-badge">{m.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Add Group Expense + Table */}
        <div className="col-lg-5">
          <div className="dashboard-card mb-4">
            <h4 className="card-title text-muted mb-3">Record Shared Expense</h4>
            <form onSubmit={handleAddExpense} data-testid="group-expense-form">
              <div className="mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  data-testid="group-expense-title"
                  placeholder="What was it for? (e.g. Dinner)"
                  value={expenseForm.title}
                  onChange={e => setExpenseForm({...expenseForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <input 
                  type="number" 
                  className="form-control" 
                  data-testid="group-expense-amount"
                  placeholder="Amount (₹)"
                  min="0" step="0.01"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn btn-success w-100" data-testid="group-expense-submit">Split Equally</button>
            </form>
          </div>

          <div className="dashboard-card">
            <h4 className="card-title text-muted">Recent Shared Activity</h4>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {expenses.length === 0 ? (
                <p className="text-center text-muted mt-3">No expenses recorded yet.</p>
              ) : (
                <ul className="list-group list-group-flush" data-testid="group-expense-list">
                  {expenses.map(exp => (
                    <li key={exp._id} data-testid="group-expense-item" className="list-group-item px-0" style={{ background: "transparent", borderBottom: "1px solid var(--border)"}}>
                      <div className="d-flex justify-content-between">
                        <strong data-testid="group-expense-item-title" style={{color: "var(--text-primary)"}}>{exp.title}</strong>
                        <span className="text-danger fw-bold" data-testid="group-expense-item-amount">₹{exp.amount.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between fs-7 text-muted mt-1">
                        <span>Paid by: {exp.paidBy?.name}</span>
                        <span>{new Date(exp.date).toLocaleDateString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default SplitSphereDashboard;
