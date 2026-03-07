import { LayoutDashboard, ListChecks, Settings, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Applications", icon: ListChecks },
  { label: "PG Review Queue", icon: ShieldCheck },
  { label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              PortfolioGuardian
            </p>
            <h1 className="text-lg font-semibold text-slate-900">Admin Portal</h1>
          </div>
          <div className="text-sm text-slate-500">Signed in as internal user</div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 md:grid-cols-[260px_1fr]">
        <Card className="h-fit p-4">
          <nav className="space-y-2">
            {navItems.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
            ))}
          </nav>
        </Card>
        <div>{children}</div>
      </div>
    </div>
  );
}
