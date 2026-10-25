import { afterEach, describe, expect, it, vi } from "vitest";
import { runInNewContext } from "node:vm";
import {
  readThemePreference,
  resolveTheme,
  saveThemePreference,
  THEME_BOOTSTRAP,
  THEME_STORAGE_KEY,
} from "./theme";

afterEach(() => vi.unstubAllGlobals());

describe("theme preference", () => {
  it.each([
    [null, false, "light"],
    [null, true, "dark"],
    ["invalid", true, "dark"],
    ["light", true, "light"],
    ["dark", false, "dark"],
  ])("resolves %s with system dark=%s to %s", (saved, system, expected) => {
    expect(resolveTheme(saved, system)).toBe(expected);
  });

  it("persists only the theme using the shared key", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => data.set(key, value),
      },
    });
    expect(readThemePreference()).toBe(null);
    saveThemePreference("dark");
    expect(readThemePreference()).toBe("dark");
    expect([...data]).toEqual([[THEME_STORAGE_KEY, "dark"]]);
    data.set(THEME_STORAGE_KEY, "invalid");
    expect(readThemePreference()).toBe(null);
  });

  it("survives blocked client storage", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("blocked");
      },
    });
    expect(readThemePreference()).toBe(null);
    expect(() => saveThemePreference("light")).not.toThrow();
  });
});

describe("pre-paint bootstrap", () => {
  it.each([
    ["dark", false, false, "dark"],
    ["light", true, false, "light"],
    [null, true, false, "dark"],
    ["bad-value", false, false, "light"],
    [null, true, true, "dark"],
  ])(
    "applies saved=%s system=%s blocked=%s before React",
    (saved, dark, blocked, expected) => {
      const document = {
        documentElement: { dataset: {} as { theme?: string } },
      };
      runInNewContext(THEME_BOOTSTRAP, {
        document,
        window: { matchMedia: () => ({ matches: dark }) },
        localStorage: {
          getItem: () => {
            if (blocked) throw new Error("blocked");
            return saved;
          },
        },
      });
      expect(document.documentElement.dataset.theme).toBe(expected);
    },
  );
});
