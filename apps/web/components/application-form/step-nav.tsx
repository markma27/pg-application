"use client";

import { useApplicationForm } from "@/lib/application-form";
import { ArrowRight, FileText, RotateCcw } from "lucide-react";

type StepNavVariant = "header" | "panel";

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

  if (isConfirmation) return null;

  const nextLabel = isReview ? (isSubmitting ? "Submitting…" : "Submit") : "Go forward";
  const handlePrimary = isReview ? submit : nextStep;

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={restart}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-white/90 px-4 text-sm font-medium text-emerald-700 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          aria-label="Restart form"
        >
          <RotateCcw className="h-4 w-4" />
          Restart
        </button>
        <button
          type="button"
          onClick={handlePrimary}
          disabled={isSubmitting}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
        {!isFirst && (
          <button
            type="button"
            onClick={prevStep}
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/40 bg-transparent text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={restart}
          className="inline-flex h-9 items-center justify-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          aria-label="Restart form"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart
        </button>
      </div>
    </div>
  );
}
