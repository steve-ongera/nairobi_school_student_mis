import { createContext, useState, useCallback } from "react";

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
    document.body.classList.toggle("toggle-sidebar");
  }, []);

  return (
    <ThemeContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      {children}
    </ThemeContext.Provider>
  );
}