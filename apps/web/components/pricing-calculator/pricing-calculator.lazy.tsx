"use client";

import dynamic from "next/dynamic";

/** Client-only load avoids hydration mismatches (localStorage + heavy client UI). */
export const PricingCalculatorLazy = dynamic(
  () => import("./pricing-calculator-client").then((m) => m.PricingCalculatorClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500">
        Loading calculator…
      </div>
    ),
  },
);
