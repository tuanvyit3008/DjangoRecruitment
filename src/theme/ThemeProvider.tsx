"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  isTheme,
  readThemePreference,
  resolveTheme,
  saveThemePreference,
  THEME_STORAGE_KEY,
  type Theme,
} from "./theme";

const ThemeContext = createContext<{
  theme: Theme | null;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The server and the first client render agree; CSS already uses the head script's theme.
  const [theme, setTheme] = useState<Theme | null>(null);
  const preference = useRef<Theme | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    preference.current = readThemePreference();
    const apply = (next: Theme) => {
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    apply(resolveTheme(preference.current, media.matches));
    const onSystemChange = () => {
      if (preference.current === null) apply(resolveTheme(null, media.matches));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      // Ignore sessionStorage events; localStorage is optional in restricted browsers.
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      preference.current = isTheme(event.newValue) ? event.newValue : null;
      apply(resolveTheme(preference.current, media.matches));
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function toggleTheme() {
    if (theme === null) return;
    const next = theme === "dark" ? "light" : "dark";
    preference.current = next;
    document.documentElement.dataset.theme = next;
    setTheme(next);
    saveThemePreference(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
