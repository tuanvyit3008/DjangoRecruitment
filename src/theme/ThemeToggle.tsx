"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Giao diện tối"
      aria-pressed={theme === "dark"}
      title={
        theme === "dark"
          ? "Chuyển sang giao diện sáng"
          : "Chuyển sang giao diện tối"
      }
      disabled={theme === null}
      onClick={toggleTheme}
    >
      <Sun className="theme-icon-sun" size={20} aria-hidden="true" />
      <Moon className="theme-icon-moon" size={20} aria-hidden="true" />
    </button>
  );
}
