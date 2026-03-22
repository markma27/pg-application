"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ClipboardList,
  FileBarChart,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Applications", icon: ClipboardList },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/report", label: "Report", icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

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
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-[family-name:var(--font-montserrat)]">
      <div className="flex min-h-screen">
        <aside className="flex w-[198px] shrink-0 flex-col border-r border-[#dce6f7] bg-[#eef4ff] px-2 py-5">
          <Link href="/admin" className="mb-6 flex w-full justify-center">
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
          <nav className="flex flex-1 flex-col gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                    active
                      ? "bg-white text-[#1e4a7a]"
                      : "text-[#334155] hover:bg-white/70 hover:text-[#0c2742]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-8">
            <h1 className="text-lg font-semibold tracking-tight text-[#0c2742]">
              Client Application Admin Portal
            </h1>
            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e4a7a] text-xs font-semibold text-white">
                {initials(profile.fullName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{profile.fullName}</p>
                <p className="truncate text-xs text-slate-500">{profile.email}</p>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="ml-1 flex items-center gap-1 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Sign out"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
