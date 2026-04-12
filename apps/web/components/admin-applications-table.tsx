"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { assignApplicationToAdmin } from "@/lib/admin/assign-application-actions";
import { Input } from "@/components/ui/input";
import { ApplicationStatusBadges } from "@/components/admin-application-status-badges";
import { normalizeWorkflowStatus, type WorkflowStatus } from "@/lib/admin/application-workflow-status";
import { NATIVE_SELECT_CLASS } from "@/lib/native-select-styles";
import { formatPortalCreatedCompact } from "@/lib/portal-datetime";
import { cn } from "@/lib/utils";

export type AdminAssignableUser = {
  id: string;
  full_name: string;
  email: string;
};

export type AdminApplicationRow = {
  id: string;
  reference: string;
  primary_contact_name: string;
  email: string;
  status: string;
  created_at: string;
  deleted_at: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  entity_count: number;
};

/** Preset from dashboard stat cards; narrows the list before search / deleted toggle. */
export type DashboardStatPreset = "today" | WorkflowStatus;

export function AdminApplicationsTable({
  rows,
  assignableUsers = [],
  presetFilter = null,
  todayStartIso,
}: {
  rows: AdminApplicationRow[];
  /** Active admin users shown in the Assignee column (empty = read-only names). */
  assignableUsers?: AdminAssignableUser[];
  presetFilter?: DashboardStatPreset | null;
  /** Required when `presetFilter` is `"today"` (must match server dashboard count logic). */
  todayStartIso?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const todayStartMs =
      presetFilter === "today" && todayStartIso ? new Date(todayStartIso).getTime() : null;

    return rows.filter((r) => {
      if (presetFilter) {
        if (presetFilter === "today") {
          if (todayStartMs === null) return false;
          if (new Date(r.created_at).getTime() < todayStartMs) return false;
        } else if (normalizeWorkflowStatus(r.status) !== presetFilter) {
          return false;
        }
      }

      if (!showDeleted && r.deleted_at) return false;
      if (!needle) return true;
      const hay = [
        r.reference,
        r.primary_contact_name,
        r.email,
        r.status,
        r.deleted_at ? "deleted" : "",
        r.assignee_name ?? "",
        String(r.entity_count),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, showDeleted, presetFilter, todayStartIso]);

  useEffect(() => {
    setPage(0);
  }, [q, showDeleted, presetFilter, todayStartIso]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const goToApplication = useCallback(
    (id: string) => {
      router.push(`/admin/applications/${id}`);
    },
    [router],
  );

  const onAssigneeChange = useCallback(
    (applicationId: string, value: string) => {
      const next = value === "" ? null : value;
      startTransition(async () => {
        setNotice(null);
        const res = await assignApplicationToAdmin(applicationId, next);
        if (!res.ok) {
          setNotice(res.error);
          return;
        }
        if ("emailWarning" in res && res.emailWarning) {
          setNotice(res.emailWarning);
        }
        router.refresh();
      });
    },
    [router],
  );

  const canAssign = assignableUsers.length > 0;

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
        >
          {notice}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by reference, name, email, status, assignee, or entity count."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-11 max-w-xl border-slate-300 bg-white dark:border-[var(--admin-input-border)] dark:bg-[var(--admin-input-bg)] dark:text-[var(--admin-dropdown-text)]"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--admin-muted-text, #64748b)" }}>
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="h-4 w-4 rounded border-slate-400 dark:border-slate-600"
          />
          Show Deleted
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white dark:border-[var(--admin-table-border)] dark:bg-[var(--admin-card-bg)]"
        style={{ borderColor: "var(--admin-table-border, #e2e8f0)" }}
      >
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b text-xs font-semibold uppercase tracking-wide"
              style={{
                background: "var(--admin-table-header-bg, #f8fafc)",
                borderColor: "var(--admin-table-border, #e2e8f0)",
                color: "var(--admin-table-header-text, #64748b)",
              }}
            >
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Primary Applicant</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Entities</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center" style={{ color: "var(--admin-muted-text)" }}>
                  No applications match your filters.
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr
                  key={r.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => goToApplication(r.id)}
                  onKeyDown={(e) => {
                    if ((e.target as HTMLElement).closest?.("select")) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToApplication(r.id);
                    }
                  }}
                  className="cursor-pointer border-b last:border-0 transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40 dark:border-[var(--admin-table-border)] dark:hover:bg-white/5 dark:focus-visible:bg-white/5"
                  style={{ borderColor: "var(--admin-table-border, #f1f5f9)" }}
                >
                  <td className="px-4 py-3 font-medium text-[#1e4a7a] dark:text-[var(--admin-brand-mid)]">{r.reference}</td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-dropdown-text, #334155)" }}>{r.primary_contact_name}</td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-muted-text, #64748b)" }}>{r.email}</td>
                  <td className="px-4 py-3">
                    <ApplicationStatusBadges status={r.status} deletedAt={r.deleted_at} />
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums font-medium" style={{ color: "var(--admin-dropdown-text, #334155)" }}>
                    {r.entity_count}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--admin-dropdown-text, #475569)" }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {canAssign ? (
                      <div className="relative w-full max-w-[220px]">
                        <select
                          aria-label={`Assignee for ${r.reference}`}
                          disabled={isPending || !!r.deleted_at}
                          value={r.assignee_id ?? ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            onAssigneeChange(r.id, e.target.value);
                          }}
                          className={NATIVE_SELECT_CLASS}
                        >
                          <option value="">— Unassigned —</option>
                          {assignableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          aria-hidden
                          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                          style={{ color: "var(--admin-muted-text)" }}
                        />
                      </div>
                    ) : (
                      <span>{r.assignee_name ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--admin-muted-text)" }}>
                    {formatPortalCreatedCompact(r.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1.5 pt-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1}`}
              aria-current={page === i ? "page" : undefined}
              className={cn(
                "flex h-9 min-w-[2.25rem] cursor-pointer items-center justify-center rounded-lg text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                page === i
                  ? "text-white"
                  : "border hover:bg-black/5 dark:hover:bg-white/10",
              )}
              style={
                page === i
                  ? { background: "var(--admin-pagination-active-bg, #1e4a7a)", color: "#ffffff", borderColor: "var(--admin-pagination-btn-border, oklch(0.922 0 0))" }
                  : { background: "var(--admin-pagination-btn-bg, #ffffff)", borderColor: "var(--admin-pagination-btn-border, oklch(0.922 0 0))", color: "var(--admin-pagination-btn-text)" }
              }
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
