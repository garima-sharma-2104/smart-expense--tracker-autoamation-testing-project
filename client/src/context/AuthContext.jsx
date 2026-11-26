import { createContext, useContext, useState, useEffect } from "react";
import API from "../utils/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch {
        localStorage.removeItem("userInfo");
      }
    }
    setLoading(false);
  }, []);

  const register = async (name, email, password) => {
    const res = await API.post("/auth/register", { name, email, password });
    const userData = res.data.data;
    setUser(userData);
    localStorage.setItem("userInfo", JSON.stringify(userData));
    return userData;
  };

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    const userData = res.data.data;
    setUser(userData);
    localStorage.setItem("userInfo", JSON.stringify(userData));
    return userData;
  };

  const updateBudget = async (budget) => {
    const res = await API.put("/auth/budget", { budget });
    const userData = res.data.data;
    
    // Merge new token if not present, but budget endpoint doesn't return token so use old one
    const mergedUser = { ...user, monthlyBudget: userData.monthlyBudget };
    setUser(mergedUser);
    localStorage.setItem("userInfo", JSON.stringify(mergedUser));
    return mergedUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateBudget,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
