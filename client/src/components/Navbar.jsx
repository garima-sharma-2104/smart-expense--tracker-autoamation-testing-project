import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="navbar" id="main-navbar">
      <div className="nav-container">
        <NavLink to="/" className="nav-logo" onClick={closeMenu}>
          <span className="logo-icon">💰</span>
          <span className="logo-text">ExpenseTracker</span>
        </NavLink>

        {/* Theme toggle + Mobile hamburger */}
        <div className="nav-right-controls">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            id="theme-toggle-btn"
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            <span className="theme-toggle-icon">
              {isDark ? "☀️" : "🌙"}
            </span>
          </button>

          <button
            className={`nav-hamburger ${mobileOpen ? "open" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            id="nav-hamburger-btn"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className={`nav-links ${mobileOpen ? "nav-links-open" : ""}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={closeMenu}
          >
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/expenses"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Expenses
              </NavLink>
              <NavLink
                to="/income"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Income
              </NavLink>
              <NavLink
                to="/add"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Add New
              </NavLink>
              <div className="nav-user">
                <span className="nav-user-name">
                  👤 {user?.name?.split(" ")[0]}
                </span>
                <button className="nav-logout-btn" onClick={handleLogout} data-testid="navbar-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                data-testid="navbar-login"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Login
              </NavLink>
              <NavLink to="/signup" data-testid="navbar-signup" className="nav-link nav-signup-btn" onClick={closeMenu}>
                Sign Up
              </NavLink>
            </>
          )}

          {/* Mobile theme toggle (inside drawer) */}
          <button
            className="theme-toggle-mobile"
            onClick={toggleTheme}
          >
            <span>{isDark ? "☀️" : "🌙"}</span>
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Mobile overlay */}
        {mobileOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
      </div>
    </nav>
  );
}

export default Navbar;
