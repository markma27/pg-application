"use client";

import Image from "next/image";
import { useApplicationForm } from "@/lib/application-form";
import { StepNav } from "@/components/application-form/step-nav";

export function ApplyShell({ children }: { children: React.ReactNode }) {
  const { state, totalSteps, currentStepLabel, currentStepDescription, reviewStepIndex, confirmationStepIndex } =
    useApplicationForm();
  const progressPercent = totalSteps > 0 ? Math.round(((state.step + 1) / totalSteps) * 100) : 0;
  const isConfirmation = state.step >= confirmationStepIndex;
  const showNavPanel = !isConfirmation;

  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* Full-width header bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex shrink-0 items-center">
            <div className="relative h-10 w-32 sm:h-12 sm:w-40">
              <Image
                src="/PortfolioGuardian_OriginalLogo.svg"
                alt="PortfolioGuardian"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </a>
          {showNavPanel && (
            <div className="flex items-center gap-2">
              <StepNav variant="header" />
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {showNavPanel && (
          <div className="space-y-2 pb-6 sm:pb-8">
            <p className="text-sm font-medium text-slate-500">
              Step {state.step + 1} of {totalSteps} ({progressPercent}%)
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-6 py-6 sm:py-8 lg:flex-row lg:gap-0 lg:pt-0">
        {/* Left: form content in grey card */}
        <div className="min-w-0 flex-1 lg:max-w-[65%]">
          <div className="h-full rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-slate-100/90 to-slate-200/60 p-6 shadow-sm sm:p-8 lg:p-10 lg:rounded-r-none lg:border-r-0">
            {children}
          </div>
        </div>

        {/* Right: green navigation panel (same height as left, no gap) */}
        {showNavPanel && (
          <aside className="flex w-full shrink-0 flex-col lg:w-[35%] lg:max-w-md">
            <div className="flex min-h-[280px] flex-1 flex-col justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-6 text-white shadow-sm sm:p-8 lg:min-h-0 lg:rounded-l-none">
              <StepNav variant="panel" showIcon />
            </div>
          </aside>
        )}
        </div>
      </div>
    </main>
  );
}
