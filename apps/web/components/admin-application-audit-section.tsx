import { AdminSectionHeader } from "@/components/admin-application-review-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  WORKFLOW_STATUS_LABEL,
  normalizeWorkflowStatus,
} from "@/lib/admin/application-workflow-status";

export type ApplicationAuditEventRow = {
  id: string;
  created_at: string;
  event_type: string;
  actor_type: string;
  actor_label: string;
  detail: Record<string, unknown> | null;
};

function eventTitle(eventType: string): string {
  switch (eventType) {
    case "form_submitted":
      return "Form submitted";
    case "status_changed":
      return "Status changed";
    default:
      return eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function actorKindLabel(actorType: string): string {
  switch (actorType) {
    case "applicant":
      return "Applicant";
    case "admin":
      return "Admin";
    case "system":
      return "System";
    default:
      return actorType;
  }
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function StatusChangeExtra({ detail }: { detail: Record<string, unknown> | null }) {
  if (!detail) return null;
  const from = detail.from_status;
  const to = detail.to_status;
  if (typeof from === "string" && typeof to === "string") {
    const fromLabel = WORKFLOW_STATUS_LABEL[normalizeWorkflowStatus(from)];
    const toLabel = WORKFLOW_STATUS_LABEL[normalizeWorkflowStatus(to)];
    return (
      <p className="mt-1 text-sm text-slate-600">
        {fromLabel} → {toLabel}
      </p>
    );
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
    <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 shadow-sm">
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
          <ol className="space-y-6">
            {sorted.map((e) => (
              <li key={e.id} className="relative pl-8">
                <span
                  className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-emerald-600 bg-white"
                  aria-hidden
                />
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {formatWhen(e.created_at)}
                </p>
                <p className="mt-1 font-semibold text-slate-900">{eventTitle(e.event_type)}</p>
                <p className="mt-0.5 text-sm text-slate-700">
                  <span className="font-medium text-emerald-900">{actorKindLabel(e.actor_type)}</span>
                  <span className="text-slate-400"> · </span>
                  <span>{e.actor_label}</span>
                </p>
                {e.event_type === "status_changed" ? <StatusChangeExtra detail={e.detail} /> : null}
                {e.detail && e.detail.inferred_from_application_row === true ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Inferred from application record (submitted before audit logging was enabled).
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
