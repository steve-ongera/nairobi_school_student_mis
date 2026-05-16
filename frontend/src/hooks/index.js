import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { useState, useEffect } from "react";

export function useAuth() {
  return useContext(AuthContext);
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useRole() {
  const { user } = useAuth();
  return {
    role: user?.role,
    isAdmin: user?.role === "admin",
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "student",
    isParent: user?.role === "parent",
    isFinance: user?.role === "finance",
    isAdminOrFinance: ["admin", "finance"].includes(user?.role),
    isAdminOrTeacher: ["admin", "teacher"].includes(user?.role),
  };
}

export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(Array.isArray(res.data) ? res.data : res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, deps);

  return { data, loading, error, refetch };
}