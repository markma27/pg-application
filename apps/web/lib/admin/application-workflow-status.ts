export const WORKFLOW_STATUS_ORDER = [
  "pending",
  "in_progress",
  "documents_sent",
  "completed",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUS_ORDER)[number];

export const WORKFLOW_STATUS_LABEL: Record<WorkflowStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  documents_sent: "Documents Sent",
  completed: "Completed",
};

/** Normalize DB value (and legacy labels) to canonical workflow status. */
export function normalizeWorkflowStatus(raw: string): WorkflowStatus {
  const x = raw.trim().toLowerCase();
  const legacy: Record<string, WorkflowStatus> = {
    new: "pending",
    pending: "pending",
    "in progress": "in_progress",
    in_progress: "in_progress",
    processed: "completed",
    documents_sent: "documents_sent",
    "documents sent": "documents_sent",
    completed: "completed",
  };
  return legacy[x] ?? "pending";
}

export function isWorkflowStatus(v: string): v is WorkflowStatus {
  return (WORKFLOW_STATUS_ORDER as readonly string[]).includes(v);
}
