import {
  WORKFLOW_STATUS_LABEL,
  normalizeWorkflowStatus,
} from "@/lib/admin/application-workflow-status";

/** Human-readable event name for tables and timelines. */
export function auditEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case "form_submitted":
      return "Form submitted";
    case "status_changed":
      return "Status changed";
    case "application_deleted":
      return "Application deleted";
    default:
      return eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function auditActorKindLabel(actorType: string): string {
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

/** Short summary for the Details column (status transition, delete ref, etc.). */
export function auditEventDetailSummary(
  eventType: string,
  detail: Record<string, unknown> | null,
): string {
  if (!detail) return "—";
  if (eventType === "status_changed") {
    const from = detail.from_status;
    const to = detail.to_status;
    if (typeof from === "string" && typeof to === "string") {
      return `${WORKFLOW_STATUS_LABEL[normalizeWorkflowStatus(from)]} → ${WORKFLOW_STATUS_LABEL[normalizeWorkflowStatus(to)]}`;
    }
  }
  if (eventType === "application_deleted") {
    const ref = detail.reference;
    if (typeof ref === "string" && ref.trim()) return ref;
  }
  if (detail.inferred_from_application_row === true) return "Inferred (legacy)";
  return "—";
}
