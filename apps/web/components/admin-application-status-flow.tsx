"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  WORKFLOW_STATUS_LABEL,
  WORKFLOW_STATUS_ORDER,
  normalizeWorkflowStatus,
  type WorkflowStatus,
} from "@/lib/admin/application-workflow-status";
import { cn } from "@/lib/utils";

/** Pastel bubble fills aligned with admin dashboard summary cards */
const STEP_SURFACE: Record<
  WorkflowStatus,
  { fill: string; borderCurrent: string; borderPast: string; borderFuture: string; label: string; subCurrent: string; subPast: string; subFuture: string }
> = {
  pending: {
    fill: "bg-[#FEF9E7]",
    borderCurrent: "border-amber-400/90 ring-2 ring-amber-400/30 shadow-sm",
    borderPast: "border-amber-200/80",
    borderFuture: "border-amber-100/70 opacity-[0.72]",
    label: "text-amber-950/90",
    subCurrent: "text-amber-900/85",
    subPast: "text-amber-900/75",
    subFuture: "text-amber-900/45",
  },
  in_progress: {
    fill: "bg-[#EBF5FB]",
    borderCurrent: "border-sky-400/90 ring-2 ring-sky-400/30 shadow-sm",
    borderPast: "border-sky-200/80",
    borderFuture: "border-sky-100/70 opacity-[0.72]",
    label: "text-sky-950/90",
    subCurrent: "text-sky-900/85",
    subPast: "text-sky-900/75",
    subFuture: "text-sky-900/45",
  },
  documents_sent: {
    fill: "bg-[#F4ECF7]",
    borderCurrent: "border-violet-400/85 ring-2 ring-violet-400/25 shadow-sm",
    borderPast: "border-violet-200/80",
    borderFuture: "border-violet-100/70 opacity-[0.72]",
    label: "text-violet-950/90",
    subCurrent: "text-violet-900/85",
    subPast: "text-violet-900/75",
    subFuture: "text-violet-900/45",
  },
  completed: {
    fill: "bg-[#E9F7EF]",
    borderCurrent: "border-emerald-500/90 ring-2 ring-emerald-400/30 shadow-sm",
    borderPast: "border-emerald-200/80",
    borderFuture: "border-emerald-100/70 opacity-[0.72]",
    label: "text-emerald-950/90",
    subCurrent: "text-emerald-900/85",
    subPast: "text-emerald-900/75",
    subFuture: "text-emerald-900/45",
  },
};

function stepButtonClass(key: WorkflowStatus, isCurrent: boolean, isPast: boolean) {
  const s = STEP_SURFACE[key];
  const border = isCurrent ? s.borderCurrent : isPast ? s.borderPast : s.borderFuture;
  return cn("rounded-xl border", s.fill, border);
}

function stepLabelClass(key: WorkflowStatus, isCurrent: boolean, isPast: boolean) {
  const s = STEP_SURFACE[key];
  if (isCurrent) return s.label;
  if (isPast) return s.label;
  return cn(s.label, "opacity-70");
}

function stepSubClass(key: WorkflowStatus, isCurrent: boolean, isPast: boolean) {
  const s = STEP_SURFACE[key];
  if (isCurrent) return s.subCurrent;
  if (isPast) return s.subPast;
  return s.subFuture;
}

/** Short meaning of each pipeline stage for admins */
const STEP_NOTES: Record<WorkflowStatus, string> = {
  pending: "Application received — queued for triage. Not yet assigned to a team member.",
  in_progress: "Assigned to someone in the team to assess, follow up, and progress the file.",
  documents_sent:
    "Proposal, LPOA and DD forms have been issued to the client for review and signature.",
  completed:
    "Signed documents received and the client is set up in PortfolioGuardian systems.",
};

function stepNoteClass(key: WorkflowStatus, isFuture: boolean) {
  if (isFuture) return "text-slate-500/85";
  switch (key) {
    case "pending":
      return "text-amber-950/75";
    case "in_progress":
      return "text-sky-950/75";
    case "documents_sent":
      return "text-violet-950/75";
    case "completed":
      return "text-emerald-950/75";
    default:
      return "text-slate-600";
  }
}

export function AdminApplicationStatusFlow({
  updateStatus,
  applicationId,
  currentStatus,
  disabled,
}: {
  updateStatus: (
    applicationId: string,
    nextStatus: WorkflowStatus,
  ) => Promise<{ ok?: true; error?: string }>;
  applicationId: string;
  currentStatus: string;
  disabled?: boolean;
}) {
  const current = normalizeWorkflowStatus(currentStatus);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const currentIndex = WORKFLOW_STATUS_ORDER.indexOf(current);

  const onSelect = (key: WorkflowStatus) => {
    if (disabled || key === current) return;
    const nextIndex = WORKFLOW_STATUS_ORDER.indexOf(key);
    const goingBack = nextIndex < currentIndex;
    if (goingBack && typeof window !== "undefined") {
      const ok = window.confirm(
        "Move this application to an earlier stage? This should be used when correcting workflow.",
      );
      if (!ok) return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateStatus(applicationId, key);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="w-full min-w-0">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        Pipeline status
      </p>
      <div className="-mx-1 flex flex-col gap-4 overflow-x-auto pb-1 sm:mx-0 sm:flex-row sm:items-stretch sm:justify-center sm:gap-3 sm:overflow-visible md:gap-4">
        {WORKFLOW_STATUS_ORDER.map((key, i) => {
          const isCurrent = key === current;
          const isPast = i < currentIndex;
          const isFuture = !isCurrent && !isPast;
          const label = WORKFLOW_STATUS_LABEL[key];
          const isLast = i === WORKFLOW_STATUS_ORDER.length - 1;

          return (
            <div key={key} className="flex items-stretch gap-0 sm:gap-2">
              <button
                type="button"
                disabled={disabled || isPending}
                onClick={() => onSelect(key)}
                title={disabled ? undefined : `Set status to ${label}`}
                className={cn(
                  "relative flex min-h-[8.5rem] w-full min-w-0 flex-1 flex-col items-stretch justify-between px-4 py-3.5 text-left transition-[box-shadow,opacity,border-color] sm:min-h-[9rem] sm:min-w-[13.5rem] sm:max-w-[16rem] sm:flex-initial sm:px-4 sm:py-4",
                  stepButtonClass(key, isCurrent, isPast),
                  disabled && "cursor-not-allowed opacity-50",
                  !disabled && !isPending && "cursor-pointer hover:brightness-[0.99]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase leading-snug tracking-wide",
                      stepLabelClass(key, isCurrent, isPast),
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      isCurrent && "bg-white/60 shadow-sm",
                      isPast && "bg-white/40",
                      isFuture && "bg-white/30",
                      stepSubClass(key, isCurrent, isPast),
                    )}
                  >
                    {isCurrent ? "Current" : isPast ? "Done" : "Upcoming"}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-2 flex-1 text-left text-[11px] leading-relaxed",
                    stepNoteClass(key, isFuture),
                  )}
                >
                  {STEP_NOTES[key]}
                </p>
              </button>
              {!isLast ? (
                <ChevronRight
                  className="hidden h-6 w-6 shrink-0 self-center text-slate-300 sm:block"
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {isPending ? (
        <p className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Updating…
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {!disabled ? (
        <p className="mt-3 text-center text-[11px] leading-snug text-slate-500">
          Click a stage to move the application. Going backward asks for confirmation.
        </p>
      ) : null}
    </div>
  );
}
