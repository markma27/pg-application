import { JM_ONLY_SERVICES } from "../constants/pricing";
import type { PricingModel } from "./pricing-model";
import { createDefaultPricingModel } from "./pricing-model";
import type {
  ApplicationAssessment,
  ApplicationInput,
  EntityAssessment,
  EntityInput,
  PricingStatus,
  RoutingOutcome,
} from "../schemas/application";

export function calculateComplexityPoints(entity: EntityInput, model: PricingModel): number {
  const p = model.complexityPoints;
  return (
    entity.listedInvestmentCount * p.listedInvestment +
    entity.unlistedInvestmentCount * p.unlistedInvestment +
    entity.propertyCount * p.investmentProperty +
    entity.wrapCount * p.wrapAccount +
    entity.bankAccountCount * p.bankAccount +
    entity.foreignBankAccountCount * p.foreignBankAccount +
    entity.loanCount * p.loan +
    entity.cryptocurrencyCount * p.cryptocurrency
  );
}

/** PG-style annual components from the pricing model (ignores service-code JM routing). */
export type EntityAnnualOngoingBreakdown = {
  complexityPoints: number;
  baseFee: number | null;
  complexitySurcharge: number | null;
  indicativeTotal: number | null;
  /** Set when a band matches the point total */
  bandPricingStatus: "indicative" | "manual_review" | null;
};

/**
 * Base fee, complexity-band surcharge, points, and total from the saved model.
 * Does not treat JM-only add-on codes as blockers so admin can reconcile figures when routing is JM-fit.
 */
export function entityAnnualOngoingBreakdown(
  entity: EntityInput,
  model: PricingModel,
): EntityAnnualOngoingBreakdown {
  const complexityPoints = calculateComplexityPoints(entity, model);
  const complexityBand = model.complexityBands.find(
    (band) => complexityPoints >= band.min && complexityPoints <= band.max,
  );
  const baseRaw = model.entityBaseFees[entity.entityType as keyof PricingModel["entityBaseFees"]];
  const baseFee = typeof baseRaw === "number" && Number.isFinite(baseRaw) ? baseRaw : null;
  const bandPricingStatus = complexityBand
    ? complexityBand.pricingStatus === "manual_review"
      ? "manual_review"
      : "indicative"
    : null;
  const complexitySurcharge =
    complexityBand != null &&
    typeof complexityBand.annualFee === "number" &&
    Number.isFinite(complexityBand.annualFee)
      ? complexityBand.annualFee
      : null;
  const indicativeTotal =
    baseFee !== null && complexitySurcharge !== null ? baseFee + complexitySurcharge : null;

  return {
    complexityPoints,
    baseFee,
    complexitySurcharge,
    indicativeTotal,
    bandPricingStatus,
  };
}

/**
 * Entity base annual fee plus complexity-band surcharge only.
 * Excludes reporting add-ons, BAS, ASIC agent, onboarding, and any other service-based annual add-ons.
 * Returns null when the same factors that block indicative PG pricing apply (JM-only path, complexity manual band, etc.).
 */
export function entityAnnualOngoingBasePlusComplexity(
  entity: EntityInput,
  model: PricingModel,
): number | null {
  if (entity.entityType === "paf" || entity.entityType === "puaf") return null;
  if (entity.serviceCodes.some((service) => JM_ONLY_SERVICES.has(service))) return null;
  if (entity.serviceCodes.includes("customised_reporting")) return null;
  if (entity.portfolioStatus === "complex_cleanup") return null;

  const d = entityAnnualOngoingBreakdown(entity, model);
  if (d.bandPricingStatus !== "indicative" || d.indicativeTotal === null) return null;
  return d.indicativeTotal;
}

export function assessEntity(entity: EntityInput, model: PricingModel): EntityAssessment {
  const jmReasons: string[] = [];
  const reviewReasons: string[] = [];

  if (entity.entityType === "paf" || entity.entityType === "puaf") {
    jmReasons.push("Entity type is PAF/PuAF and must be handled by JM.");
  }

  if (entity.serviceCodes.some((service) => JM_ONLY_SERVICES.has(service))) {
    jmReasons.push("Selected services include JM-only work.");
  }

  if (entity.serviceCodes.includes("customised_reporting")) {
    jmReasons.push("Customised reporting requires JM or manual review.");
  }

  const complexityPoints = calculateComplexityPoints(entity, model);
  const complexityBand = model.complexityBands.find(
    (band) => complexityPoints >= band.min && complexityPoints <= band.max,
  );

  if (!complexityBand) {
    reviewReasons.push("Complexity could not be classified.");
  } else if (complexityBand.pricingStatus === "manual_review") {
    reviewReasons.push("Complexity exceeds instant-pricing threshold.");
  }

  if (entity.portfolioStatus === "complex_cleanup") {
    reviewReasons.push("Complex cleanup requires manual review.");
  }

  let routingOutcome: RoutingOutcome = "pg_fit";
  let pricingStatus: PricingStatus = "indicative";
  let annualFeeEstimate: number | null = null;
  let onboardingFeeEstimate: number | null = null;

  if (jmReasons.length > 0) {
    routingOutcome = "jm_fit";
    pricingStatus = "not_available";
  } else if (reviewReasons.length > 0) {
    routingOutcome = "manual_review";
    pricingStatus = "manual_review";
  } else {
    const baseFee =
      model.entityBaseFees[entity.entityType as keyof PricingModel["entityBaseFees"]] ?? null;
    const reportingAddOns = entity.serviceCodes.reduce((sum, serviceCode) => {
      return (
        sum + (model.reportingAddOns[serviceCode as keyof PricingModel["reportingAddOns"]] ?? 0)
      );
    }, 0);
    const serviceAddOns = entity.serviceCodes.reduce((sum, serviceCode) => {
      return sum + (model.otherAddOns[serviceCode as keyof PricingModel["otherAddOns"]] ?? 0);
    }, 0);

    if (baseFee === null || !complexityBand) {
      routingOutcome = "manual_review";
      pricingStatus = "review_required";
      reviewReasons.push("Pricing configuration is incomplete for this entity.");
    } else {
      annualFeeEstimate = baseFee + complexityBand.annualFee + reportingAddOns + serviceAddOns;
      onboardingFeeEstimate =
        model.onboardingFees[entity.portfolioStatus as keyof PricingModel["onboardingFees"]] ??
        null;

      if (onboardingFeeEstimate === null) {
        routingOutcome = "manual_review";
        pricingStatus = "review_required";
        reviewReasons.push("Onboarding fee requires manual review.");
        annualFeeEstimate = null;
      }
    }
  }

  return {
    entityId: entity.id,
    entityName: entity.entityName,
    entityType: entity.entityType,
    routingOutcome,
    pricingStatus,
    complexityPoints,
    annualFeeEstimate,
    onboardingFeeEstimate,
    jmReasons,
    reviewReasons,
  };
}

export function assessApplication(
  input: ApplicationInput,
  pricingModel: PricingModel = createDefaultPricingModel(),
): ApplicationAssessment {
  const entityAssessments = input.entities.map((e) => assessEntity(e, pricingModel));
  const pgEntities = entityAssessments.filter((entity) => entity.routingOutcome === "pg_fit");
  const requiresJmFollowUp = entityAssessments.some((entity) => entity.routingOutcome === "jm_fit");
  const requiresManualReview = entityAssessments.some(
    (entity) => entity.routingOutcome === "manual_review",
  );

  const annualSubtotal = pgEntities.reduce(
    (sum, entity) => sum + (entity.annualFeeEstimate ?? 0),
    0,
  );
  const onboardingSubtotal = pgEntities.reduce(
    (sum, entity) => sum + (entity.onboardingFeeEstimate ?? 0),
    0,
  );

  const overallOutcome: RoutingOutcome = requiresManualReview
    ? "manual_review"
    : requiresJmFollowUp && pgEntities.length === 0
      ? "jm_fit"
      : "pg_fit";

  const indicativePricingAvailable =
    !requiresManualReview &&
    pgEntities.length > 0 &&
    pgEntities.length < 6 &&
    pgEntities.every(
      (entity) =>
        entity.pricingStatus === "indicative" &&
        entity.annualFeeEstimate !== null &&
        entity.onboardingFeeEstimate !== null,
    );

  const totalEstimate = indicativePricingAvailable
    ? annualSubtotal + onboardingSubtotal
    : null;

  return {
    overallOutcome,
    indicativePricingAvailable,
    annualSubtotal,
    onboardingSubtotal,
    totalEstimate,
    requiresJmFollowUp,
    requiresManualReview: requiresManualReview || pgEntities.length >= 6,
    entityAssessments,
  };
}
