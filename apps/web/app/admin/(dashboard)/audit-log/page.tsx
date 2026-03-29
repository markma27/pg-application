import { createClient } from "@/lib/supabase/server";
import type { AdminAuditLogTableRow } from "@/components/admin-audit-log-table";
import { AdminAuditLogTable } from "@/components/admin-audit-log-table";

const FETCH_LIMIT = 3000;

export default async function AdminAuditLogPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-950">
        Configure Supabase to load the audit log.
      </div>
    );
  }

  const { data, error } = await supabase
    .from("application_audit_events")
    .select(
      `
      id,
      created_at,
      event_type,
      actor_type,
      actor_label,
      detail,
      application_id,
      applications ( reference )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(FETCH_LIMIT);

  let rows: AdminAuditLogTableRow[] = [];

  if (!error && data) {
    rows = data.map((r) => {
      const raw = r.applications as { reference: string } | { reference: string }[] | null | undefined;
      const app = Array.isArray(raw) ? raw[0] : raw;
      return {
        id: r.id as string,
        created_at: r.created_at as string,
        event_type: r.event_type as string,
        actor_type: r.actor_type as string,
        actor_label: r.actor_label as string,
        detail: (r.detail as Record<string, unknown> | null) ?? null,
        application_id: r.application_id as string,
        reference: app?.reference?.trim() || "—",
      };
    });
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0c2742]">Audit log</h2>
          <p className="mt-1 text-sm text-slate-600">
            Status changes, submissions, and deletions recorded for applications.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Could not load audit events: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0c2742]">Audit log</h2>
        <p className="mt-1 text-sm text-slate-600">
          Application events in reverse chronological order (status changes, form submissions, deletions). Up to{" "}
          {FETCH_LIMIT.toLocaleString()} most recent events.
        </p>
      </div>
      <AdminAuditLogTable rows={rows} />
    </div>
  );
}
