import {
  COMPLEXITY_BANDS,
  COMPLEXITY_POINTS,
  ENTITY_BASE_FEES,
  ONBOARDING_FEES,
  OTHER_ADD_ONS,
  REPORTING_ADD_ONS,
} from "../constants/pricing";

/** Mutable snapshot of all fee/tier inputs used by assessment (defaults match production constants). */
export type PricingModel = {
  entityBaseFees: {
    individual: number;
    company: number;
    trust: number;
    smsf: number;
  };
  complexityPoints: {
    listedInvestment: number;
    unlistedInvestment: number;
    investmentProperty: number;
    wrapAccount: number;
  };
  complexityBands: Array<{
    min: number;
    max: number;
    annualFee: number;
    pricingStatus: "indicative" | "manual_review";
  }>;
  reportingAddOns: {
    quarterly_reporting: number;
    monthly_reporting: number;
  };
  otherAddOns: {
    bas: number;
    asic_agent: number;
  };
  onboardingFees: {
    new: number;
    existing_clean: number;
    existing_reconciliation: number;
  };
};

export function createDefaultPricingModel(): PricingModel {
  return {
    entityBaseFees: { ...ENTITY_BASE_FEES },
    complexityPoints: { ...COMPLEXITY_POINTS },
    complexityBands: COMPLEXITY_BANDS.map((b) => ({
      min: b.min,
      max: b.max,
      annualFee: b.annualFee,
      pricingStatus: b.pricingStatus,
    })),
    reportingAddOns: { ...REPORTING_ADD_ONS },
    otherAddOns: { ...OTHER_ADD_ONS },
    onboardingFees: { ...ONBOARDING_FEES },
  };
}

function toFiniteNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Merge partial or legacy stored JSON into a complete model so assessment always has valid numbers. */
export function mergePricingModelWithDefaults(partial: unknown): PricingModel {
  const d = createDefaultPricingModel();
  if (!partial || typeof partial !== "object") return d;
  const p = partial as Partial<PricingModel>;

  const bands =
    Array.isArray(p.complexityBands) && p.complexityBands.length === d.complexityBands.length
      ? p.complexityBands.map((b, i) => {
          const def = d.complexityBands[i]!;
          const last = i === p.complexityBands!.length - 1;
          return {
            min: typeof b.min === "number" && Number.isFinite(b.min) ? b.min : def.min,
            max: last
              ? Number.POSITIVE_INFINITY
              : typeof b.max === "number" && Number.isFinite(b.max)
                ? b.max
                : def.max,
            annualFee:
              typeof b.annualFee === "number" && Number.isFinite(b.annualFee) ? b.annualFee : def.annualFee,
            pricingStatus:
              b.pricingStatus === "manual_review" || b.pricingStatus === "indicative"
                ? b.pricingStatus
                : def.pricingStatus,
          };
        })
      : d.complexityBands;

  const ob = p.onboardingFees;
  const onboardingFees = {
    new: toFiniteNumber(ob?.new ?? d.onboardingFees.new, d.onboardingFees.new),
    existing_clean: toFiniteNumber(ob?.existing_clean ?? d.onboardingFees.existing_clean, d.onboardingFees.existing_clean),
    existing_reconciliation: toFiniteNumber(
      ob?.existing_reconciliation ?? d.onboardingFees.existing_reconciliation,
      d.onboardingFees.existing_reconciliation,
    ),
  };

  return {
    entityBaseFees: {
      individual: toFiniteNumber(p.entityBaseFees?.individual ?? d.entityBaseFees.individual, d.entityBaseFees.individual),
      company: toFiniteNumber(p.entityBaseFees?.company ?? d.entityBaseFees.company, d.entityBaseFees.company),
      trust: toFiniteNumber(p.entityBaseFees?.trust ?? d.entityBaseFees.trust, d.entityBaseFees.trust),
      smsf: toFiniteNumber(p.entityBaseFees?.smsf ?? d.entityBaseFees.smsf, d.entityBaseFees.smsf),
    },
    complexityPoints: {
      listedInvestment: toFiniteNumber(
        p.complexityPoints?.listedInvestment ?? d.complexityPoints.listedInvestment,
        d.complexityPoints.listedInvestment,
      ),
      unlistedInvestment: toFiniteNumber(
        p.complexityPoints?.unlistedInvestment ?? d.complexityPoints.unlistedInvestment,
        d.complexityPoints.unlistedInvestment,
      ),
      investmentProperty: toFiniteNumber(
        p.complexityPoints?.investmentProperty ?? d.complexityPoints.investmentProperty,
        d.complexityPoints.investmentProperty,
      ),
      wrapAccount: toFiniteNumber(
        p.complexityPoints?.wrapAccount ?? d.complexityPoints.wrapAccount,
        d.complexityPoints.wrapAccount,
      ),
    },
    complexityBands: bands,
    reportingAddOns: {
      quarterly_reporting: toFiniteNumber(
        p.reportingAddOns?.quarterly_reporting ?? d.reportingAddOns.quarterly_reporting,
        d.reportingAddOns.quarterly_reporting,
      ),
      monthly_reporting: toFiniteNumber(
        p.reportingAddOns?.monthly_reporting ?? d.reportingAddOns.monthly_reporting,
        d.reportingAddOns.monthly_reporting,
      ),
    },
    otherAddOns: {
      bas: toFiniteNumber(p.otherAddOns?.bas ?? d.otherAddOns.bas, d.otherAddOns.bas),
      asic_agent: toFiniteNumber(p.otherAddOns?.asic_agent ?? d.otherAddOns.asic_agent, d.otherAddOns.asic_agent),
    },
    onboardingFees,
  };
}
