import { AdminSectionHeader } from "@/components/admin-application-review-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  auditActorKindLabel,
  auditEventTypeLabel,
} from "@/lib/admin/audit-event-display";
import {
  WORKFLOW_STATUS_LABEL,
  normalizeWorkflowStatus,
} from "@/lib/admin/application-workflow-status";
import { formatPortalDateTime } from "@/lib/portal-datetime";

export type ApplicationAuditEventRow = {
  id: string;
  created_at: string;
  event_type: string;
  actor_type: string;
  actor_label: string;
  detail: Record<string, unknown> | null;
};

function statusChangeInline(detail: Record<string, unknown> | null): string | null {
  if (!detail) return null;
  const from = detail.from_status;
  const to = detail.to_status;
  if (typeof from === "string" && typeof to === "string") {
    const fromLabel = WORKFLOW_STATUS_LABEL[normalizeWorkflowStatus(from)];
    const toLabel = WORKFLOW_STATUS_LABEL[normalizeWorkflowStatus(to)];
    return `${fromLabel} → ${toLabel}`;
  }
  return null;
}

export function AdminApplicationAuditSection({
  events,
  legacySubmission,
}: {
  events: ApplicationAuditEventRow[];
  legacySubmission: { applicationId: string; created_at: string; actor_label: string } | null;
}) {
  const hasFormSubmitted = events.some((e) => e.event_type === "form_submitted");
  const timeline: ApplicationAuditEventRow[] =
    !hasFormSubmitted && legacySubmission
      ? [
          {
            id: `legacy-form-${legacySubmission.applicationId}`,
            created_at: legacySubmission.created_at,
            event_type: "form_submitted",
            actor_type: "applicant",
            actor_label: legacySubmission.actor_label,
            detail: { inferred_from_application_row: true },
          },
          ...events,
        ]
      : events;

  const sorted = [...timeline].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
      <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
        <AdminSectionHeader
          title="Audit"
          subtitle="Submission and later changes (e.g. status updates) appear here in order."
        />
      </CardHeader>
      <CardContent className="px-6 py-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500">No audit events recorded for this application yet.</p>
        ) : (
          <ol className="space-y-3">
            {sorted.map((e) => {
              const transition =
                e.event_type === "status_changed" ? statusChangeInline(e.detail) : null;
              const inferred = e.detail && e.detail.inferred_from_application_row === true;
              return (
                <li key={e.id} className="relative pl-7">
                  <span
                    className="absolute left-0 top-[0.35rem] h-2.5 w-2.5 shrink-0 rounded-full border-2 border-emerald-600 bg-white"
                    aria-hidden
                  />
                  <p className="text-sm leading-snug text-slate-800">
                    <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-slate-500">
                      {formatPortalDateTime(e.created_at)}
                    </span>
                    <span className="text-slate-300"> · </span>
                    <span className="font-semibold text-slate-900">{auditEventTypeLabel(e.event_type)}</span>
                    {transition ? (
                      <>
                        <span className="text-slate-300"> · </span>
                        <span className="text-slate-700">{transition}</span>
                      </>
                    ) : null}
                    <span className="text-slate-300"> · </span>
                    <span className="font-medium text-emerald-900">{auditActorKindLabel(e.actor_type)}</span>
                    <span className="text-slate-300"> · </span>
                    <span className="break-words">{e.actor_label}</span>
                    {inferred ? (
                      <span className="text-slate-500">
                        {" "}
                        <span className="whitespace-nowrap text-xs">
                          (inferred — submitted before audit logging)
                        </span>
                      </span>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
