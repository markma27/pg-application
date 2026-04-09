"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { assignApplicationToAdmin } from "@/lib/admin/assign-application-actions";
import { Input } from "@/components/ui/input";
import { ApplicationStatusBadges } from "@/components/admin-application-status-badges";
import { normalizeWorkflowStatus, type WorkflowStatus } from "@/lib/admin/application-workflow-status";
import { NATIVE_SELECT_CLASS } from "@/lib/native-select-styles";
import { formatPortalCreatedCompact } from "@/lib/portal-datetime";

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
          className="h-11 max-w-xl border-slate-300 bg-white"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="h-4 w-4 rounded border-slate-400"
          />
          Show Deleted
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-600">
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
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No applications match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
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
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80 focus-visible:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40"
                >
                  <td className="px-4 py-3 font-medium text-[#1e4a7a]">{r.reference}</td>
                  <td className="px-4 py-3 text-slate-800">{r.primary_contact_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.email}</td>
                  <td className="px-4 py-3">
                    <ApplicationStatusBadges status={r.status} deletedAt={r.deleted_at} />
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-slate-800 font-medium">
                    {r.entity_count}
                  </td>
                  <td
                    className="px-4 py-3 text-slate-700"
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
                          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                        />
                      </div>
                    ) : (
                      <span>{r.assignee_name ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {formatPortalCreatedCompact(r.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
