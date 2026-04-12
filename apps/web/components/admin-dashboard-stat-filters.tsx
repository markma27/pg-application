"use client";

import { useCallback, useState } from "react";
import {
  AdminApplicationsTable,
  type AdminApplicationRow,
  type AdminAssignableUser,
  type DashboardStatPreset,
} from "@/components/admin-applications-table";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCard = {
  label: string;
  value: number;
  className: string;
  preset: DashboardStatPreset;
};

export function AdminDashboardStatFilters({
  cards,
  rows,
  todayStartIso,
  assignableUsers = [],
}: {
  cards: StatCard[];
  rows: AdminApplicationRow[];
  todayStartIso: string;
  assignableUsers?: AdminAssignableUser[];
}) {
  const [active, setActive] = useState<DashboardStatPreset | null>(null);

  const onToggle = useCallback((preset: DashboardStatPreset) => {
    setActive((prev) => (prev === preset ? null : preset));
  }, []);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => {
          const isOn = active === c.preset;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => onToggle(c.preset)}
              aria-pressed={isOn}
              className={cn(
                "rounded-xl text-left transition-[box-shadow,ring] outline-none focus-visible:ring-2 focus-visible:ring-[#0c2742]/30",
                isOn && [
                  "ring-2 ring-[#0c2742]/50 ring-offset-2 ring-offset-[#f4f6f9]",
                  "dark:ring-offset-[var(--admin-page-bg,#f4f6f9)]",
                ],
              )}
            >
              <Card
                className={cn(
                  "h-full cursor-pointer border-0 p-5 transition-colors",
                  c.className,
                  "dark:opacity-90",
                )}
              >
                <p className="text-sm font-medium text-slate-700 dark:text-[var(--admin-muted-text)]">{c.label}</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-[#0c2742] dark:text-[var(--admin-sidebar-active-text)]">{c.value}</p>
              </Card>
            </button>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#0c2742] dark:text-[var(--admin-section-title)]">Applications</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-[var(--admin-muted-text)]">
          Submissions from the public form. Open a row to review full application details.
        </p>
        <div className="mt-6">
          <AdminApplicationsTable
            rows={rows}
            assignableUsers={assignableUsers}
            presetFilter={active}
            todayStartIso={todayStartIso}
          />
        </div>
      </div>
    </>
  );
}
