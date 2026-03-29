import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PricingCalculatorLazy } from "@/components/pricing-calculator/pricing-calculator.lazy";

export const metadata: Metadata = {
  title: "Pricing Calculator | PortfolioGuardian",
  description: "Internal indicative fee calculator for PortfolioGuardian pricing rules.",
  robots: { index: false, follow: false },
};

export default function PricingCalculatorPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="border-b border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Home
          </Link>
        </div>
      </div>
      <PricingCalculatorLazy />
    </main>
  );
}
