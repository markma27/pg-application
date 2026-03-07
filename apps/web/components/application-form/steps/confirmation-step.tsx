"use client";

import Link from "next/link";
import { useApplicationForm } from "@/lib/application-form";

export function ConfirmationStep() {
  const { state } = useApplicationForm();
  const result = state.submitResult;

  if (!result) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">No submission result. You can restart the form.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
          Application received
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Thank you. Your application has been submitted successfully.
        </p>
      </div>

      <div className="mx-auto max-w-lg space-y-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">Application Reference</p>
          <p className="mt-1 font-mono text-lg font-semibold text-slate-900">{result.applicationId}</p>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {result.indicativePricingAvailable && result.pgEstimatedTotals != null && (
            <div className="border-l-4 border-emerald-500 pl-4 py-1">
              <p className="font-semibold text-slate-900">Indicative total (GST exclusive)</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">${result.pgEstimatedTotals.toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-500">A formal proposal will be sent after review.</p>
            </div>
          )}
          {result.requiresJmFollowUp && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Some entities will be reviewed by Jaquillard Minns. A separate quote or engagement will follow where appropriate.
              </p>
            </div>
          )}
          {result.requiresManualReview && !result.indicativePricingAvailable && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Our team will review your application and confirm pricing or next steps shortly.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-8 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Return to home
          </Link>
        </div>
      </div>
    </>
  );
}
