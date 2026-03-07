"use client";

import Image from "next/image";
import { useApplicationForm } from "@/lib/application-form";

export function ApplyShell({ children }: { children: React.ReactNode }) {
  const { state, totalSteps } = useApplicationForm();
  const progressPercent = totalSteps > 0 ? Math.round(((state.step + 1) / totalSteps) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6 flex flex-col gap-6 sm:mb-8">
          <div className="flex justify-center">
            <div className="relative h-32 w-full max-w-[560px]">
              <Image
                src="/PortfolioGuardian_OriginalLogo.svg"
                alt="PortfolioGuardian"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              Page {state.step + 1} of {totalSteps} ({progressPercent}%)
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}
