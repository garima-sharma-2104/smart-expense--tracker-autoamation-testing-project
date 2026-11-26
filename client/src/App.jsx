import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import AddExpense from "./pages/AddExpense";
import EditExpense from "./pages/EditExpense";
import Income from "./pages/Income";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Groups from "./pages/Groups";
import SplitSphereDashboard from "./pages/SplitSphereDashboard";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

// Layout for pages with Sidebar
const DashboardLayout = ({ children }) => (
  <div className="dashboard-layout">
    <Sidebar />
    <main className="dashboard-main-content">
      {children}
    </main>
  </div>
);

// Layout for public pages (Home, Login, Signup)
const PublicLayout = ({ children }) => (
  <div className="app">
    <Navbar />
    <main className="main-content">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ToastContainer position="top-right" autoClose={3000} theme="colored" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>}
            />
            <Route
              path="/analytics"
              element={<ProtectedRoute><DashboardLayout><Analytics /></DashboardLayout></ProtectedRoute>}
            />
            <Route
              path="/expenses"
              element={<ProtectedRoute><DashboardLayout><Expenses /></DashboardLayout></ProtectedRoute>}
            />
            <Route
              path="/income"
              element={<ProtectedRoute><DashboardLayout><Income /></DashboardLayout></ProtectedRoute>}
            />
            <Route
              path="/groups"
              element={<ProtectedRoute><DashboardLayout><Groups /></DashboardLayout></ProtectedRoute>}
            />
            <Route
              path="/groups/:id"
              element={<ProtectedRoute><DashboardLayout><SplitSphereDashboard /></DashboardLayout></ProtectedRoute>}
            />
            <Route
              path="/add"
              element={<ProtectedRoute><DashboardLayout><AddExpense /></DashboardLayout></ProtectedRoute>}
            />
            <Route
              path="/edit/:id"
              element={<ProtectedRoute><DashboardLayout><EditExpense /></DashboardLayout></ProtectedRoute>}
            />
            <Route
              path="/settings"
              element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
