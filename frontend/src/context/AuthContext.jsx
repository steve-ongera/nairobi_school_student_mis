import { createContext, useState, useEffect, useCallback } from "react";
import { login as apiLogin, logout as apiLogout } from "../utils/api";
import { setTokens, clearTokens, getStoredUser, setStoredUser, getAccessToken } from "../utils/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiLogin(email, password);
      setTokens(data.access, data.refresh);
      const userData = {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        profile_picture: data.profile_picture,
        refresh: data.refresh,
      };
      setStoredUser(userData);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Login failed. Check your credentials.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const stored = getStoredUser();
      if (stored?.refresh) await apiLogout(stored.refresh);
    } catch { /* ignore */ }
    clearTokens();
    setUser(null);
  }, []);

  // Validate token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}