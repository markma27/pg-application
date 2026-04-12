"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  Moon,
  ScrollText,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminIdleLogout } from "@/components/admin-idle-logout";
import { AdminProfileMenu } from "@/components/admin-profile-menu";
import { useAdminTheme } from "@/components/admin-theme-provider";
import { cn } from "@/lib/utils";

const topNavItems = [
  { href: "/admin", label: "Applications", icon: ClipboardList },
  { href: "/admin/pricing-calculator", label: "Pricing Calculator", icon: Calculator },
  { href: "/admin/report", label: "Report", icon: FileBarChart },
] as const;

const bottomNavItems = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function navLinkActive(href: string, pathname: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/applications");
  }
  if (href === "/admin/report") {
    return pathname === "/admin/report" || pathname === "/admin/report/";
  }
  if (href === "/admin/pricing-calculator") {
    return pathname === "/admin/pricing-calculator" || pathname.startsWith("/admin/pricing-calculator/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  const pathname = usePathname();
  const active = navLinkActive(href, pathname);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
        "text-[#334155] hover:bg-white/70 hover:text-[#0c2742]",
        "dark:text-[var(--admin-sidebar-text)] dark:hover:bg-[var(--admin-sidebar-hover-bg)] dark:hover:text-[var(--admin-sidebar-active-text)]",
        active && [
          "bg-white text-[#1e4a7a]",
          "dark:bg-[var(--admin-sidebar-active-bg)] dark:text-[var(--admin-sidebar-active-text)]",
        ],
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      {label}
    </Link>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function AdminShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: { fullName: string; email: string };
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useAdminTheme();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="h-dvh overflow-hidden font-[family-name:var(--font-montserrat)]"
      style={{ background: "var(--admin-page-bg, #f4f6f9)" }}
    >
      <AdminIdleLogout />
      <aside
        className="fixed inset-y-0 left-0 z-30 flex w-[198px] flex-col overflow-y-auto border-r px-2 py-5"
        style={{
          background: "var(--admin-sidebar-bg, #eef4ff)",
          borderColor: "var(--admin-sidebar-border, #dce6f7)",
        }}
      >
        <Link href="/admin" className="mb-6 flex w-full shrink-0 justify-center">
          <div className="relative h-[86px] w-full max-w-[288px]">
            <Image
              src="/PortfolioGuardian_OriginalLogo.svg"
              alt="PortfolioGuardian"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>
        <nav className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-0.5">
            {topNavItems.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} />
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-0.5 border-t pt-4"
            style={{ borderColor: "var(--admin-sidebar-border, #dce6f7)" }}
          >
            {bottomNavItems.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} />
            ))}
          </div>
        </nav>
      </aside>

      <div className="ml-[198px] flex h-dvh min-h-0 flex-col overflow-hidden">
        <header
          className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between border-b px-8"
          style={{
            background: "var(--admin-header-bg, #ffffff)",
            borderColor: "var(--admin-header-border, rgb(148 163 184 / 0.2))",
          }}
        >
          <h1
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--admin-header-title, #0c2742)" }}
          >
            Client Application Admin Portal
          </h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              style={{ color: "var(--admin-header-title, #0c2742)" }}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden />
              ) : (
                <Moon className="h-4 w-4" aria-hidden />
              )}
            </button>

            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg py-1 pl-1 pr-0 marker:hidden [&::-webkit-details-marker]:hidden">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: "var(--admin-brand-dark, #1e4a7a)", color: "white" }}
                >
                  {initials(profile.fullName)}
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--admin-header-title, #0c2742)" }}>
                    {profile.fullName}
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--admin-muted-text, #64748b)" }}>
                    {profile.email}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 group-open:rotate-180" aria-hidden
                  style={{ color: "var(--admin-muted-text, #64748b)" }}
                />
              </summary>
              <div
                className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-lg border shadow-lg"
                style={{
                  background: "var(--admin-dropdown-bg, #ffffff)",
                  borderColor: "var(--admin-dropdown-border, #e2e8f0)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <AdminProfileMenu fullName={profile.fullName} />
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  style={{ color: "var(--admin-dropdown-text, #334155)" }}
                >
                  Sign out
                </button>
              </div>
            </details>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
