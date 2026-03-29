import type { Metadata } from "next";
import { PricingCalculatorLazy } from "@/components/pricing-calculator/pricing-calculator.lazy";

export const metadata: Metadata = {
  title: "Pricing Calculator | Admin",
  description: "Indicative fee calculator for internal use.",
};

export default function AdminPricingCalculatorPage() {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      <PricingCalculatorLazy embedded />
    </div>
  );
}
