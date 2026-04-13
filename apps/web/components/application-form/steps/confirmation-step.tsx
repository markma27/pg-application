"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useApplicationForm } from "@/lib/application-form";
import { downloadApplicationPdf } from "@/lib/application-pdf-download";
import { formStateToPayload } from "@/lib/application-form/types";
import { Download, Mail, Phone } from "lucide-react";

/** Fallback if the API did not return a DB reference (e.g. persistence disabled). */
function formatReferenceFallback(applicationId: string): string {
  const hex = applicationId.replace(/-/g, "").slice(-8);
  const num = parseInt(hex, 16) % 1000000;
  const suffix = String(num).padStart(6, "0");
  return `PG-${suffix}`;
}

export function ConfirmationStep() {
  const { state } = useApplicationForm();
  const result = state.submitResult;
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    const payload = formStateToPayload(state);
    if (!result || !payload) return;
    setIsDownloadingPdf(true);
    try {
      const ref = result.reference?.trim() || formatReferenceFallback(result.applicationId);
      await downloadApplicationPdf({
        payload,
        reference: ref,
        filenameBase: ref,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [state, result]);

  if (!result) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">No submission result. You can restart the form.</p>
      </div>
    );
  }

  const referenceNumber = result.reference?.trim() || formatReferenceFallback(result.applicationId);

  return (
    <div className="mx-auto max-w-2xl pt-8">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Link href="/" className="cursor-pointer">
          <div className="relative h-[6.05rem] w-[19.36rem] sm:h-[7.26rem] sm:w-[24.2rem]">
            <Image
              src="/PortfolioGuardian_OriginalLogo.svg"
              alt="PortfolioGuardian"
              fill
              className="object-contain object-center"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Success message */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
          Application Submitted!
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Thank you for choosing PortfolioGuardian for your investment portfolio administration needs.
        </p>
      </div>

      {/* Reference number */}
      <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/50 px-6 py-5 text-center">
        <p className="text-sm font-semibold text-emerald-800">Reference Number</p>
        <p className="mt-1 font-mono text-2xl font-bold text-emerald-700">{referenceNumber}</p>
        <p className="mt-2 text-xs text-slate-500">Please save this reference number for your records.</p>
      </div>

      {/* What happens next */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900">What happens next?</h2>
        <ol className="mt-4 space-y-4">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              1
            </span>
            <div>
              <p className="font-medium text-slate-900">Application review</p>
              <p className="mt-0.5 text-sm text-slate-600">
                Our PortfolioGuardian team will review your application within 2 - 3 business days.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              2
            </span>
            <div>
              <p className="font-medium text-slate-900">Team contact</p>
              <p className="mt-0.5 text-sm text-slate-600">
                We&apos;ll reach out if we need any further information.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              3
            </span>
            <div>
              <p className="font-medium text-slate-900">Next steps</p>
              <p className="mt-0.5 text-sm text-slate-600">
                We will provide a proposal and advise you of the next steps.
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* Need help */}
      <div className="mb-8 rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-slate-100/90 to-slate-200/50 px-6 py-5 text-center">
        <h2 className="text-lg font-bold text-slate-900">Need help?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Questions about your application? Contact our friendly team:
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          <a
            href="mailto:applications@portfolioguardian.com.au"
            className="flex items-center gap-2 text-emerald-700 hover:underline"
          >
            <Mail className="h-4 w-4 shrink-0" />
            applications@portfolioguardian.com.au
          </a>
          <a
            href="tel:+611300000000"
            className="flex items-center gap-2 text-emerald-700 hover:underline"
          >
            <Phone className="h-4 w-4 shrink-0" />
            1300 722 942
          </a>
        </div>
        <a
          href={`mailto:applications@portfolioguardian.com.au?subject=Application%20inquiry%20-%20Reference%20${encodeURIComponent(referenceNumber)}`}
          className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-400 px-4 py-2 text-sm font-medium !text-white transition-colors hover:bg-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Email about this application
        </a>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
        <Link
          href="/"
          className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-8 text-sm font-medium !text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Return to Home
        </Link>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-red-600 bg-red-600 px-8 text-sm font-medium !text-white transition-colors hover:bg-red-700 hover:border-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          {isDownloadingPdf ? "Preparing PDF…" : "Download PDF copy"}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg border-2 border-emerald-600 bg-white px-8 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Print Confirmation
        </button>
      </div>
    </div>
  );
}
