import { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

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

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      const payload = res.data;
      // Unwrap DRF paginated responses: { count, next, previous, results: [...] }
      setData(
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
          ? payload.results
          : payload
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}