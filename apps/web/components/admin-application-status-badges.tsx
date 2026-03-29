import {
  WORKFLOW_STATUS_LABEL,
  normalizeWorkflowStatus,
} from "@/lib/admin/application-workflow-status";
import { cn } from "@/lib/utils";

/** Workflow pill, or Deleted only when soft-deleted (same styling as the applications table). */
export function ApplicationStatusBadges({
  status,
  deletedAt,
}: {
  status: string;
  deletedAt: string | null;
}) {
  if (deletedAt) {
    return (
      <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-900">
        Deleted
      </span>
    );
  }

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
