"use client";

import { useApplicationForm } from "@/lib/application-form";

export function StepNav() {
  const { state, prevStep, nextStep, restart, submit } = useApplicationForm();
  const { isSubmitting, stepError } = state;
  const isFirst = state.step === 0;
  const isReview = state.step === 2 + state.entityCount;
  const isConfirmation = state.step >= 3 + state.entityCount;

  if (isConfirmation) return null;

  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6">
      {stepError && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {stepError}
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={restart}
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#e1251b] px-6 text-sm font-medium text-white transition-colors hover:bg-[#c91d14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e1251b] disabled:opacity-50"
        >
          Restart
        </button>
        <div className="flex gap-3">
          {!isFirst && (
            <button
              type="button"
              onClick={prevStep}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
            >
              Back
            </button>
          )}
          {isReview ? (
            <button
              type="button"
              onClick={submit}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#cdd1d5] px-8 text-sm font-medium text-slate-700 transition-colors hover:bg-[#b0b5ba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#cdd1d5] px-8 text-sm font-medium text-slate-700 transition-colors hover:bg-[#b0b5ba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
