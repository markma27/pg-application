"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicationForm } from "@/lib/application-form";
import { formStateToPayload } from "@/lib/application-form/types";
import { downloadApplicationPdf } from "@/lib/application-pdf-download";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, ArrowRight, Download, FileText, RotateCcw } from "lucide-react";

const PREVIEW_PDF_REFERENCE = "TBA";

type StepNavVariant = "header" | "panel";

const RESTART_MESSAGE = "Are you sure you want to restart? All progress will be lost and you'll return to the landing page.";

export function StepNav({ variant = "panel", showIcon }: { variant?: StepNavVariant; showIcon?: boolean }) {
  const router = useRouter();
  const {
    state,
    prevStep,
    nextStep,
    restart,
    submit,
    reviewStepIndex,
    confirmationStepIndex,
    individualDetailsStepIndex,
    currentStepLabel,
    currentStepDescription,
  } = useApplicationForm();
  const { isSubmitting, stepError } = state;
  const isFirst = state.step === 0;
  const isReview = state.step === reviewStepIndex;
  const isConfirmation = state.step >= confirmationStepIndex;
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const previewPayload = useMemo(() => (isReview ? formStateToPayload(state) : null), [isReview, state]);

  const handleDownloadPdf = useCallback(async () => {
    if (!previewPayload) return;
    setIsPdfLoading(true);
    try {
      await downloadApplicationPdf({
        payload: previewPayload,
        reference: PREVIEW_PDF_REFERENCE,
        filenameBase: PREVIEW_PDF_REFERENCE,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsPdfLoading(false);
    }
  }, [previewPayload]);

  if (isConfirmation) return null;

  const nextLabel = isReview ? (isSubmitting ? "Submitting…" : "Submit") : "Go forward";
  const handlePrimary = isReview ? submit : nextStep;
  const openRestartConfirm = () => setShowRestartConfirm(true);
  const closeRestartConfirm = () => setShowRestartConfirm(false);
  const confirmRestart = () => {
    closeRestartConfirm();
    restart();
    router.push("/");
  };

  if (variant === "header") {
    return (
      <>
        <ConfirmDialog
          open={showRestartConfirm}
          onClose={closeRestartConfirm}
          title="Restart application?"
          description={RESTART_MESSAGE}
          confirmLabel="Restart"
          onConfirm={confirmRestart}
        />
        <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openRestartConfirm}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white/90 px-4 text-sm font-medium text-emerald-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Restart form"
        >
          <RotateCcw className="h-4 w-4" />
          Restart
        </button>
        {state.step >= 1 && (
          <button
            type="button"
            onClick={prevStep}
            disabled={isSubmitting}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handlePrimary}
          disabled={isSubmitting}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-center">
      {showIcon && (
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-white">
            <FileText className="h-7 w-7" />
          </span>
        </div>
      )}
      <div className="space-y-2">
        {state.step === individualDetailsStepIndex && (
          <p className="text-sm font-medium text-emerald-100">Know Your Customer (KYC)</p>
        )}
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{currentStepLabel}</h2>
        <p className="text-sm text-emerald-100">{currentStepDescription}</p>
      </div>
      {stepError && (
        <p className="text-sm font-medium text-red-200" role="alert">
          {stepError}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handlePrimary}
          disabled={isSubmitting}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
        {!isFirst && (
          <button
            type="button"
            onClick={prevStep}
            disabled={isSubmitting}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-white/40 bg-transparent text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
        )}
        {isReview && (
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!previewPayload || isPdfLoading || isSubmitting}
            title={
              !previewPayload
                ? "Complete all required fields so the application can be validated before generating a PDF."
                : undefined
            }
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/40 bg-transparent text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            {isPdfLoading ? "Preparing…" : "Download PDF"}
          </button>
        )}
      </div>
    </div>
  );
}
