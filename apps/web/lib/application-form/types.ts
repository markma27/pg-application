import type { ApplicationInput, EntityInput } from "@pg/shared";

/** Where to send a document type */
export type DocumentSendTo = "trustee" | "adviser" | "not_required";

export interface ApplicationFormState {
  /** Step index: 0 = contact, 1 = entity count, 2..2+3N-1 = entity details, 2+3N = adviser details, 3+3N = review, 4+3N = confirmation */
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
  /** Individual details (step before adviser): 1–4 individuals */
  individualCount: number;
  individuals: PartialIndividual[];
  /** Adviser & admin details (step before review) */
  adviserName: string;
  adviserCompany: string;
  adviserAddress: string;
  adviserTel: string;
  adviserFax: string;
  adviserEmail: string;
  nominateAdviserPrimaryContact: boolean | "";
  authoriseAdviserAccessStatements: boolean | "";
  authoriseDealWithAdviserDirect: boolean | "";
  annualReportSendTo: DocumentSendTo | "";
  meetingProxySendTo: DocumentSendTo | "";
  investmentOffersSendTo: DocumentSendTo | "";
  dividendPreference: "cash" | "reinvest" | "";
  /** Set after successful submit */
  submitResult: SubmitResult | null;
  /** Submitting in progress */
  isSubmitting: boolean;
  /** Validation error for current step */
  stepError: string | null;
}

/** Relationship to account (multiple allowed per individual) */
export type IndividualRelationshipRole = "individual" | "trustee" | "director" | "company_secretary";

export interface PartialIndividual {
  id: string;
  relationshipRoles: IndividualRelationshipRole[];
  title: string;
  fullName: string;
  streetAddress: string;
  streetAddressLine2: string;
  taxFileNumber: string;
  dateOfBirth: string;
  countryOfBirth: string;
  city: string;
  occupation: string;
  employer: string;
  email: string;
}

export interface PartialEntity {
  id: string;
  entityName: string;
  entityType: EntityInput["entityType"] | "";
  portfolioStatus: EntityInput["portfolioStatus"] | "";
  portfolioHin: string;
  abn: string;
  tfn: string;
  registeredForGst: boolean | "";
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
      portfolioHin: e.portfolioHin ?? "",
      abn: e.abn ?? "",
      tfn: e.tfn ?? "",
      registeredForGst: e.registeredForGst === "" ? undefined : e.registeredForGst,
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
