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
    bankAccount: number;
    foreignBankAccount: number;
    loan: number;
    cryptocurrency: number;
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

type ComplexityBand = PricingModel["complexityBands"][number];

/** True when stored band matches the default row’s min/max (open-ended last row uses +∞). */
function complexityBandStructurallyMatches(
  b: Partial<{ min: number; max: number }>,
  def: ComplexityBand,
  isLast: boolean,
): boolean {
  if (typeof b.min !== "number" || !Number.isFinite(b.min) || b.min !== def.min) return false;
  if (isLast) {
    return b.max === Number.POSITIVE_INFINITY || b.max === Infinity;
  }
  return typeof b.max === "number" && Number.isFinite(b.max) && b.max === def.max;
}

/**
 * Merge stored bands onto current defaults. Rows are matched by index when min/max align with the
 * default template so legacy saves (e.g. fewer bands before the open-ended row started at 51) pick
 * up new middle tiers without discarding customized fees for unchanged ranges.
 */
function mergeComplexityBandsFromPartial(
  saved: unknown[] | undefined,
  defaults: ComplexityBand[],
): ComplexityBand[] {
  if (!Array.isArray(saved)) return defaults;
  return defaults.map((def, i) => {
    const isLast = i === defaults.length - 1;
    const b = saved[i];
    if (!b || typeof b !== "object") return def;
    const partial = b as Partial<ComplexityBand>;
    if (!complexityBandStructurallyMatches(partial, def, isLast)) return def;
    return {
      min: def.min,
      max: isLast ? Number.POSITIVE_INFINITY : def.max,
      annualFee:
        typeof partial.annualFee === "number" && Number.isFinite(partial.annualFee)
          ? partial.annualFee
          : def.annualFee,
      pricingStatus:
        partial.pricingStatus === "manual_review" || partial.pricingStatus === "indicative"
          ? partial.pricingStatus
          : def.pricingStatus,
    };
  });
}

/** Merge partial or legacy stored JSON into a complete model so assessment always has valid numbers. */
export function mergePricingModelWithDefaults(partial: unknown): PricingModel {
  const d = createDefaultPricingModel();
  if (!partial || typeof partial !== "object") return d;
  const p = partial as Partial<PricingModel>;

  const bands = mergeComplexityBandsFromPartial(p.complexityBands, d.complexityBands);

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
      bankAccount: toFiniteNumber(
        p.complexityPoints?.bankAccount ?? d.complexityPoints.bankAccount,
        d.complexityPoints.bankAccount,
      ),
      foreignBankAccount: toFiniteNumber(
        p.complexityPoints?.foreignBankAccount ?? d.complexityPoints.foreignBankAccount,
        d.complexityPoints.foreignBankAccount,
      ),
      loan: toFiniteNumber(p.complexityPoints?.loan ?? d.complexityPoints.loan, d.complexityPoints.loan),
      cryptocurrency: toFiniteNumber(
        p.complexityPoints?.cryptocurrency ?? d.complexityPoints.cryptocurrency,
        d.complexityPoints.cryptocurrency,
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
