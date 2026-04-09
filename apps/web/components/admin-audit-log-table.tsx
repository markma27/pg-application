"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  auditActorKindLabel,
  auditEventDetailSummary,
  auditEventTypeLabel,
} from "@/lib/admin/audit-event-display";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPortalDateTime } from "@/lib/portal-datetime";

export type AdminAuditLogTableRow = {
  id: string;
  created_at: string;
  event_type: string;
  actor_type: string;
  actor_label: string;
  detail: Record<string, unknown> | null;
  application_id: string;
  reference: string;
};

export function AdminAuditLogTable({ rows }: { rows: AdminAuditLogTableRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const detailText = auditEventDetailSummary(r.event_type, r.detail);
      const hay = [
        r.reference,
        auditEventTypeLabel(r.event_type),
        r.event_type,
        auditActorKindLabel(r.actor_type),
        r.actor_type,
        r.actor_label,
        detailText,
        formatPortalDateTime(r.created_at),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by reference, event type, actor, or status change details."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-11 max-w-xl border-slate-300 bg-white"
        aria-label="Search audit log"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <th className="whitespace-nowrap px-4 py-3">When</th>
              <th className="px-4 py-3">Application</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Actor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  {rows.length === 0
                    ? "No audit events recorded yet."
                    : "No events match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className={cn("border-b border-slate-100 last:border-0", "hover:bg-slate-50/80")}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatPortalDateTime(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/applications/${r.application_id}`}
                      className="font-medium text-[#1e4a7a] hover:underline"
                    >
                      {r.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-800">{auditEventTypeLabel(r.event_type)}</td>
                  <td className="max-w-[min(28rem,40vw)] px-4 py-3 text-slate-700">
                    <span className="break-words">{auditEventDetailSummary(r.event_type, r.detail)}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="font-medium text-emerald-900">{auditActorKindLabel(r.actor_type)}</span>
                    <span className="text-slate-400"> · </span>
                    <span className="break-words">{r.actor_label}</span>
                  </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 ? (
        <p className="text-xs text-slate-500">
          Showing {filtered.length} of {rows.length} event{rows.length === 1 ? "" : "s"}
          {q.trim() ? " (filtered)" : ""}.
        </p>
      ) : null}
    </div>
  );
}
