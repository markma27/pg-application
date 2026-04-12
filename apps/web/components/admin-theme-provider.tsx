"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AdminTheme = "light" | "dark";

type AdminThemeContextValue = {
  theme: AdminTheme;
  toggleTheme: () => void;
};

const AdminThemeContext = createContext<AdminThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

function applyDarkClasses(theme: AdminTheme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("admin-dark");
    root.classList.add("dark");
  } else {
    root.classList.remove("admin-dark");
    root.classList.remove("dark");
  }
}

function readStoredTheme(): AdminTheme {
  try {
    const raw = window.localStorage.getItem("admin-theme");
    if (raw === "dark" || raw === "light") return raw;
  } catch {
    /* ignore — private mode, quota, disabled storage */
  }
  return "light";
}

/**
 * Admin portal theme provider.
 *
 * Wrapped around the admin dashboard layout. Manages two classes on
 * `<html>`:
 *   - `.dark`       — activates Tailwind's built-in `dark:` variant
 *                     (declared in globals.css as
 *                     `@custom-variant dark (&:is(.dark *))`).
 *   - `.admin-dark` — applies the admin-scoped CSS variables and the
 *                     utility-override block in globals.css.
 *
 * Navigation correctness:
 *   Earlier versions returned a cleanup function from the class-applying
 *   `useEffect`. That cleanup fired spuriously on soft navigation within
 *   the dashboard (e.g. when React reconciled the layout tree and the
 *   provider briefly remounted), which stripped the classes from `<html>`
 *   and made the page flip to light mode.
 *
 *   The fix below uses a SINGLE `useEffect` gated on a first-render ref.
 *   The first run of the effect (mount) reads the persisted theme from
 *   localStorage, applies it imperatively, and syncs React state.
 *   Subsequent runs (triggered by the user toggling) apply the new
 *   theme. Critically, the mount path never calls `applyDarkClasses`
 *   with the stale default `theme="light"`, so classes applied from a
 *   previous mount survive a remount.
 *
 *   Leaking into non-admin layouts (e.g. `/admin/login`, public pages)
 *   is handled by `AdminDarkModeReset` mounted in the root app layout
 *   — see apps/web/components/admin-dark-mode-reset.tsx.
 */
export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("light");
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      // First run: read the persisted theme and apply it imperatively.
      // If it differs from the initial state, sync React state too so
      // consumers (e.g. the header toggle icon) reflect the truth.
      const stored = readStoredTheme();
      applyDarkClasses(stored);
      if (stored !== theme) {
        setTheme(stored);
      }
      return;
    }
    // Subsequent runs: theme changed because the user toggled.
    applyDarkClasses(theme);
    try {
      window.localStorage.setItem("admin-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
