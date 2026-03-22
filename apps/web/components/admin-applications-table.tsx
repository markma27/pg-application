"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  WORKFLOW_STATUS_LABEL,
  normalizeWorkflowStatus,
} from "@/lib/admin/application-workflow-status";
import { cn } from "@/lib/utils";

export type AdminApplicationRow = {
  id: string;
  reference: string;
  primary_contact_name: string;
  email: string;
  status: string;
  created_at: string;
  deleted_at: string | null;
  assignee_name: string | null;
  entity_count: number;
};

function formatCreated(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function StatusBadge({ status }: { status: string }) {
  const key = normalizeWorkflowStatus(status);
  const label = WORKFLOW_STATUS_LABEL[key];
  const variantClass =
    key === "pending"
      ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80"
      : key === "in_progress"
        ? "bg-sky-100 text-sky-900"
        : key === "documents_sent"
          ? "bg-violet-100 text-violet-900"
          : "bg-emerald-100 text-emerald-900";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", variantClass)}>
      {label}
    </span>
  );
}

export function AdminApplicationsTable({ rows }: { rows: AdminApplicationRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!showDeleted && r.deleted_at) return false;
      if (!needle) return true;
      const hay = [
        r.reference,
        r.primary_contact_name,
        r.email,
        r.status,
        r.assignee_name ?? "",
        String(r.entity_count),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, showDeleted]);

  const goToApplication = useCallback(
    (id: string) => {
      router.push(`/admin/applications/${id}`);
    },
    [router],
  );

  return (
    <div className="space-y-4">
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
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-slate-800 font-medium">
                    {r.entity_count}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.assignee_name ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {formatCreated(r.created_at)}
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
