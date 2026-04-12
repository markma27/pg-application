"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Removes the `dark` and `admin-dark` classes from `<html>` whenever the
 * current route is NOT an admin-dashboard route.
 *
 * Why this exists: `AdminThemeProvider` deliberately does not clean up
 * its classes on unmount (doing so caused the theme to flip to light
 * during navigation within the dashboard — see the comment in
 * `admin-theme-provider.tsx`). This component is the counter-balance:
 * it ensures the admin dark classes can never leak into `/admin/login`,
 * `/admin/forgot-password`, `/admin/update-password`, or any public
 * (non-admin) page.
 *
 * Mounted from the root app layout so it runs on every pathname change.
 */
export function AdminDarkModeReset() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const inDashboard =
      pathname === "/admin" ||
      (pathname.startsWith("/admin/") &&
        !pathname.startsWith("/admin/login") &&
        !pathname.startsWith("/admin/forgot-password") &&
        !pathname.startsWith("/admin/update-password"));

    if (inDashboard) return;

    const root = document.documentElement;
    root.classList.remove("admin-dark");
    root.classList.remove("dark");
  }, [pathname]);

  return null;
}
