import { mergePricingModelWithDefaults, type PricingModel } from "@pg/shared";

/** Browser + DB storage key (legacy local fallback). */
export const PRICING_CALCULATOR_STORAGE_KEY = "pg-pricing-calculator-model";

export function stringifyPricingModel(m: PricingModel): string {
  return JSON.stringify(m, (_, v) => (v === Number.POSITIVE_INFINITY ? "__INF__" : v));
}

export function parsePricingModelJson(raw: string): PricingModel | null {
  try {
    const p = JSON.parse(raw, (_, v) => (v === "__INF__" ? Number.POSITIVE_INFINITY : v));
    return mergePricingModelWithDefaults(p);
  } catch {
    return null;
  }
}
