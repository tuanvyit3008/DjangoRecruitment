export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "ptit_careerhub_theme_v1";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(preference: unknown, systemDark: boolean): Theme {
  return isTheme(preference) ? preference : systemDark ? "dark" : "light";
}

export function readThemePreference(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveThemePreference(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked; the current tab still keeps its in-memory choice.
  }
}

// Parser-blocking head script: apply the preference before the body can paint.
// Keep this self-contained: it runs before React or any client bundles load.
export const THEME_BOOTSTRAP = `(() => {
  let preference;
  try { preference = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); } catch {}
  const theme = preference === "light" || preference === "dark"
    ? preference
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
})();`;
