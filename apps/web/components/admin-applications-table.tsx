"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type AdminApplicationRow = {
  id: string;
  reference: string;
  primary_contact_name: string;
  email: string;
  overall_outcome: string;
  status: string;
  created_at: string;
  sla_due_at: string | null;
  deleted_at: string | null;
  assignee_name: string | null;
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

function daysLeft(sla: string | null): number | null {
  if (!sla) return null;
  const end = new Date(sla).setHours(0, 0, 0, 0);
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

function outcomeLabel(outcome: string) {
  switch (outcome) {
    case "pg_fit":
      return "PG fit";
    case "jm_fit":
      return "JM referral";
    case "manual_review":
      return "Manual review";
    default:
      return outcome;
  }
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const o = outcome.toLowerCase();
  const variant =
    o === "pg_fit"
      ? "bg-emerald-100 text-emerald-900"
      : o === "jm_fit"
        ? "bg-emerald-200 text-emerald-950"
        : o === "manual_review"
          ? "bg-slate-200 text-slate-800"
          : "bg-slate-100 text-slate-700";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", variant)}>
      {outcomeLabel(outcome)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "processed") {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
        Processed
      </span>
    );
  }
  if (s === "in progress") {
    return (
      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-900">
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-800">
      {status}
    </span>
  );
}

export function AdminApplicationsTable({ rows }: { rows: AdminApplicationRow[] }) {
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
        outcomeLabel(r.overall_outcome),
        r.overall_outcome,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, showDeleted]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by reference, name, email, status, assignee, or assessment outcome."
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
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Primary Applicant</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Assessment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Days Left</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  No applications match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 font-medium text-[#0c2742]">{r.reference}</td>
                  <td className="px-4 py-3 text-slate-800">{r.primary_contact_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.email}</td>
                  <td className="px-4 py-3">
                    <OutcomeBadge outcome={r.overall_outcome} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.assignee_name ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {daysLeft(r.sla_due_at) ?? "—"}
                  </td>
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
