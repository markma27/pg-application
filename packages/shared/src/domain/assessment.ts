import {
  COMPLEXITY_BANDS,
  COMPLEXITY_POINTS,
  ENTITY_BASE_FEES,
  JM_ONLY_SERVICES,
  ONBOARDING_FEES,
  OTHER_ADD_ONS,
  REPORTING_ADD_ONS,
} from "../constants/pricing.js";
import type {
  ApplicationAssessment,
  ApplicationInput,
  EntityAssessment,
  EntityInput,
  PricingStatus,
  RoutingOutcome,
} from "../schemas/application.js";

function calculateComplexityPoints(entity: EntityInput) {
  return (
    entity.listedInvestmentCount * COMPLEXITY_POINTS.listedInvestment +
    entity.unlistedInvestmentCount * COMPLEXITY_POINTS.unlistedInvestment +
    entity.propertyCount * COMPLEXITY_POINTS.investmentProperty +
    entity.wrapCount * COMPLEXITY_POINTS.wrapAccount +
    (entity.hasCrypto ? COMPLEXITY_POINTS.crypto : 0) +
    (entity.hasForeignInvestments ? COMPLEXITY_POINTS.foreignInvestments : 0)
  );
}

function deriveGroupDiscount(pgEntityCount: number, annualSubtotal: number) {
  if (pgEntityCount <= 2) return 0;
  if (pgEntityCount === 3) return annualSubtotal * 0.05;
  if (pgEntityCount <= 5) return annualSubtotal * 0.1;
  return 0;
}

function assessEntity(entity: EntityInput): EntityAssessment {
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

  const complexityPoints = calculateComplexityPoints(entity);
  const complexityBand = COMPLEXITY_BANDS.find(
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
      ENTITY_BASE_FEES[entity.entityType as keyof typeof ENTITY_BASE_FEES] ?? null;
    const reportingAddOns = entity.serviceCodes.reduce((sum, serviceCode) => {
      return sum + (REPORTING_ADD_ONS[serviceCode as keyof typeof REPORTING_ADD_ONS] ?? 0);
    }, 0);
    const serviceAddOns = entity.serviceCodes.reduce((sum, serviceCode) => {
      return sum + (OTHER_ADD_ONS[serviceCode as keyof typeof OTHER_ADD_ONS] ?? 0);
    }, 0);

    if (baseFee === null || !complexityBand) {
      routingOutcome = "manual_review";
      pricingStatus = "review_required";
      reviewReasons.push("Pricing configuration is incomplete for this entity.");
    } else {
      annualFeeEstimate = baseFee + complexityBand.annualFee + reportingAddOns + serviceAddOns;
      onboardingFeeEstimate =
        ONBOARDING_FEES[entity.portfolioStatus as keyof typeof ONBOARDING_FEES] ?? null;

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

export function assessApplication(input: ApplicationInput): ApplicationAssessment {
  const entityAssessments = input.entities.map(assessEntity);
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
  const groupDiscountAmount =
    pgEntities.length >= 6 ? 0 : deriveGroupDiscount(pgEntities.length, annualSubtotal);

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
    ? annualSubtotal + onboardingSubtotal - groupDiscountAmount
    : null;

  return {
    overallOutcome,
    indicativePricingAvailable,
    annualSubtotal,
    onboardingSubtotal,
    groupDiscountAmount,
    totalEstimate,
    requiresJmFollowUp,
    requiresManualReview: requiresManualReview || pgEntities.length >= 6,
    entityAssessments,
  };
}
