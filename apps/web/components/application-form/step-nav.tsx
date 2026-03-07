"use client";

import { useState } from "react";
import { useApplicationForm } from "@/lib/application-form";
import { ArrowLeft, ArrowRight, FileText, RotateCcw, AlertTriangle } from "lucide-react";

type StepNavVariant = "header" | "panel";

const RESTART_MESSAGE = "Are you sure you want to restart? All progress will be lost and you'll return to step 1.";

export function StepNav({ variant = "panel", showIcon }: { variant?: StepNavVariant; showIcon?: boolean }) {
  const {
    state,
    prevStep,
    nextStep,
    restart,
    submit,
    reviewStepIndex,
    confirmationStepIndex,
    currentStepLabel,
    currentStepDescription,
  } = useApplicationForm();
  const { isSubmitting, stepError } = state;
  const isFirst = state.step === 0;
  const isReview = state.step === reviewStepIndex;
  const isConfirmation = state.step >= confirmationStepIndex;
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  if (isConfirmation) return null;

  const nextLabel = isReview ? (isSubmitting ? "Submitting…" : "Submit") : "Go forward";
  const handlePrimary = isReview ? submit : nextStep;
  const openRestartConfirm = () => setShowRestartConfirm(true);
  const closeRestartConfirm = () => setShowRestartConfirm(false);
  const confirmRestart = () => {
    restart();
    closeRestartConfirm();
  };

  const restartConfirmModal = showRestartConfirm && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restart-dialog-title"
      aria-describedby="restart-dialog-description"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={closeRestartConfirm}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </span>
          <div className="space-y-2">
            <h2 id="restart-dialog-title" className="text-lg font-semibold text-slate-900 sm:text-xl">
              Restart application?
            </h2>
            <p id="restart-dialog-description" className="text-sm text-slate-600">
              {RESTART_MESSAGE}
            </p>
          </div>
          <div className="flex w-full flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeRestartConfirm}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRestart}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === "header") {
    return (
      <>
        {restartConfirmModal}
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
    <>
      {restartConfirmModal}
    <div className="flex flex-col gap-6 text-center">
      {showIcon && (
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-white">
            <FileText className="h-7 w-7" />
          </span>
        </div>
      )}
      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{currentStepLabel}</h2>
        <p className="text-sm text-emerald-100">{currentStepDescription}</p>
      </div>
      {stepError && (
        <p className="text-sm font-medium text-amber-200" role="alert">
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
        <button
          type="button"
          onClick={openRestartConfirm}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          aria-label="Restart form"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart
        </button>
      </div>
    </div>
    </>
  );
}
