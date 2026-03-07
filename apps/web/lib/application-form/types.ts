import type { ApplicationInput, EntityInput } from "@pg/shared";

export interface ApplicationFormState {
  /** Step index: 0 = contact, 1 = entity count, 2..2+3N-1 = entity details (3 sub-steps each), 2+3N = review, 3+3N = confirmation */
  step: number;
  /** Contact/group (step 0) */
  primaryContactName: string;
  email: string;
  phone: string;
  applicantRole: string;
  adviserDetails: string;
  groupName: string;
  /** How many entities (step 1). Drives steps 2..2+3N-1 (3 sub-steps per entity) */
  entityCount: number;
  /** Entity drafts; length must match entityCount before review */
  entities: PartialEntity[];
  /** Set after successful submit */
  submitResult: SubmitResult | null;
  /** Submitting in progress */
  isSubmitting: boolean;
  /** Validation error for current step */
  stepError: string | null;
}

export interface PartialEntity {
  id: string;
  entityName: string;
  entityType: EntityInput["entityType"] | "";
  portfolioStatus: EntityInput["portfolioStatus"] | "";
  listedInvestmentCount: number;
  unlistedInvestmentCount: number;
  propertyCount: number;
  wrapCount: number;
  otherAssetsText: string;
  hasCrypto: boolean;
  hasForeignInvestments: boolean;
  serviceCodes: EntityInput["serviceCodes"][number][];
  commencementDate: string;
}

export interface SubmitResult {
  applicationId: string;
  submissionSuccess: boolean;
  overallOutcome: string;
  indicativePricingAvailable: boolean;
  pgEstimatedTotals: number | null;
  requiresJmFollowUp: boolean;
  requiresManualReview: boolean;
  entityAssessments?: { entityName: string; routingOutcome: string; annualFeeEstimate: number | null; onboardingFeeEstimate: number | null }[];
}

export function formStateToPayload(state: ApplicationFormState): ApplicationInput | null {
  if (state.entityCount < 1 || state.entities.length !== state.entityCount) return null;
  const raw = state.entities.slice(0, state.entityCount).map((e) => {
    if (!e.entityType || !e.portfolioStatus || e.serviceCodes.length === 0 || !e.commencementDate)
      return null;
    return {
      id: e.id,
      entityName: e.entityName || "Unnamed",
      entityType: e.entityType,
      portfolioStatus: e.portfolioStatus,
      listedInvestmentCount: e.listedInvestmentCount ?? 0,
      unlistedInvestmentCount: e.unlistedInvestmentCount ?? 0,
      propertyCount: e.propertyCount ?? 0,
      wrapCount: e.wrapCount ?? 0,
      otherAssetsText: e.otherAssetsText ?? "",
      hasCrypto: e.hasCrypto ?? false,
      hasForeignInvestments: e.hasForeignInvestments ?? false,
      serviceCodes: e.serviceCodes,
      commencementDate: e.commencementDate,
    } as EntityInput;
  });
  const entities = raw.filter((e): e is EntityInput => e !== null);
  if (entities.length !== state.entityCount) return null;
  return {
    primaryContactName: state.primaryContactName,
    email: state.email,
    phone: state.phone,
    applicantRole: state.applicantRole,
    adviserDetails: state.adviserDetails ?? "",
    groupName: state.groupName ?? "",
    entities,
  };
}
