import { APPLICANT_ROLE_ADVISER_REPRESENTATIVE, type EntityInput, type FullApplicationSubmission } from "@pg/shared";
import { ADD_ON_SERVICE_CODES, STANDARD_SERVICE_CODES } from "./constants";

/** Single option for where to send a document type */
export type DocumentSendTo = "trustee" | "adviser" | "not_required";
/** Value: multiple (trustee and/or adviser) or not_required. When not_required, trustee/adviser are cleared. */
export type DocumentSendToValue = ("trustee" | "adviser")[] | "not_required" | "";

export interface ApplicationFormState {
  /** Step index: 0 = contact, 1 = entity count, 2..2+3N-1 = entity details, 2+3N = adviser details, 3+3N = review, 4+3N = confirmation */
  step: number;
  /** Contact/group (step 0) */
  primaryContactName: string;
  email: string;
  phone: string;
  /** Primary applicant postal address (required; contact step). */
  postalAddress: string;
  applicantRole: string;
  /** Required when applicantRole is Adviser / representative */
  representativeAuthorityConfirmed: boolean;
  adviserDetails: string;
  groupName: string;
  /** How many entities (step 1). Drives steps 2..2+3N-1 (3 sub-steps per entity) */
  entityCount: number;
  /** Entity drafts; length must match entityCount before review */
  entities: PartialEntity[];
  /** Individual details (step before adviser): 1–4 individuals */
  individualCount: number;
  individuals: PartialIndividual[];
  /** Preferred commencement (apply to entire client group) */
  groupCommencementDate: string;
  /** Selected add-on service codes (apply to all entities) */
  selectedAddOnServiceCodes: EntityInput["serviceCodes"][number][];
  /** PAF & PuAF services – five independent toggles (apply to all entities) */
  pafPuafServiceToggles: {
    annualFinancialStatements: boolean;
    annualInformationStatement: boolean;
    frankingCreditRefundApplication: boolean;
    pafResponsiblePersonServices: boolean;
    puafSubFundMonthlyStatements: boolean;
  };
  /** Other comments or notes about services (applies to entire group) */
  servicesComments: string;
  /** When false, adviser contact fields and adviser-only questions are hidden and omitted from submission */
  hasInvestmentAdviser: boolean;
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
  annualReportSendTo: DocumentSendToValue;
  meetingProxySendTo: DocumentSendToValue;
  investmentOffersSendTo: DocumentSendToValue;
  dividendPreference: "cash" | "reinvest" | "";
  /** Set after successful submit */
  submitResult: SubmitResult | null;
  /** Submitting in progress */
  isSubmitting: boolean;
  /** Validation error for current step */
  stepError: string | null;
  /** Field key that failed validation (e.g. "email", "individual_0_email") for highlighting */
  stepErrorField: string | null;
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
  /** Optional portfolio reports when status is existing — uploaded to Supabase after JSON submit */
  existingPortfolioReportFiles?: File[];
  portfolioHin: string;
  abn: string;
  tfn: string;
  registeredForGst: boolean | "";
  listedInvestmentCount: number;
  unlistedInvestmentCount: number;
  propertyCount: number;
  wrapCount: number;
  bankAccountCount: number;
  foreignBankAccountCount: number;
  loanCount: number;
  cryptocurrencyCount: number;
  otherAssetsText: string;
  hasCrypto: boolean;
  hasForeignInvestments: boolean;
  serviceCodes: EntityInput["serviceCodes"][number][];
  commencementDate: string;
  /** Primary bank — toggle; if true, bank detail fields are required */
  hasPrimaryBankAccount: boolean;
  primaryBankName: string;
  primaryBankAccountName: string;
  primaryBankBsb: string;
  primaryBankAccountNumber: string;
}

/** True when any entity in the group (first `entityCount` drafts) is PAF or PuAF — entity type is chosen on the entity-type sub-step. */
export function groupHasPafOrPuafEntity(state: ApplicationFormState): boolean {
  return state.entities
    .slice(0, Math.max(0, state.entityCount))
    .some((e) => e.entityType === "paf" || e.entityType === "puaf");
}

export interface SubmitResult {
  applicationId: string;
  /** Opaque token for portfolio file upload APIs (only when persistence succeeded). */
  portfolioUploadToken?: string | null;
  /** Human-readable reference from Supabase (e.g. PG-100001). */
  reference: string | null;
  submissionSuccess: boolean;
  overallOutcome: string;
  indicativePricingAvailable: boolean;
  pgEstimatedTotals: number | null;
  requiresJmFollowUp: boolean;
  requiresManualReview: boolean;
  entityAssessments?: { entityName: string; routingOutcome: string; annualFeeEstimate: number | null; onboardingFeeEstimate: number | null }[];
}

export function formStateToPayload(state: ApplicationFormState): FullApplicationSubmission | null {
  if (state.entityCount < 1 || state.entities.length !== state.entityCount) return null;
  if (!state.groupCommencementDate?.trim()) return null;
  const toggles = state.pafPuafServiceToggles ?? {
    annualFinancialStatements: false,
    annualInformationStatement: false,
    frankingCreditRefundApplication: false,
    pafResponsiblePersonServices: false,
    puafSubFundMonthlyStatements: false,
  };
  const pafPuafCodes: EntityInput["serviceCodes"][number][] = [];
  if (groupHasPafOrPuafEntity(state)) {
    if (toggles.annualFinancialStatements || toggles.annualInformationStatement) pafPuafCodes.push("acnc_ais");
    if (toggles.frankingCreditRefundApplication) pafPuafCodes.push("franking_credit_refund_support");
    if (toggles.pafResponsiblePersonServices) pafPuafCodes.push("responsible_person");
    if (toggles.puafSubFundMonthlyStatements) pafPuafCodes.push("sub_fund_monthly_statements");
  }

  const serviceCodes = [
    ...STANDARD_SERVICE_CODES,
    ...(state.selectedAddOnServiceCodes ?? []),
    ...pafPuafCodes,
  ];
  const raw = state.entities.slice(0, state.entityCount).map((e) => {
    if (!e.entityType || !e.portfolioStatus) return null;
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
      bankAccountCount: e.bankAccountCount ?? 0,
      foreignBankAccountCount: e.foreignBankAccountCount ?? 0,
      loanCount: e.loanCount ?? 0,
      cryptocurrencyCount: e.cryptocurrencyCount ?? 0,
      otherAssetsText: e.otherAssetsText ?? "",
      hasCrypto: e.hasCrypto ?? false,
      hasForeignInvestments: e.hasForeignInvestments ?? false,
      serviceCodes,
      commencementDate: state.groupCommencementDate,
      hasPrimaryBankAccount: e.hasPrimaryBankAccount ?? false,
      primaryBankName: e.primaryBankName ?? "",
      primaryBankAccountName: e.primaryBankAccountName ?? "",
      primaryBankBsb: e.primaryBankBsb ?? "",
      primaryBankAccountNumber: e.primaryBankAccountNumber ?? "",
    } as EntityInput;
  });
  const entities = raw.filter((e): e is EntityInput => e !== null);
  if (entities.length !== state.entityCount) return null;

  const individualsRaw = state.individuals.slice(0, state.individualCount);
  const individuals = individualsRaw.map((ind) => ({
    id: ind.id,
    relationshipRoles: ind.relationshipRoles ?? [],
    title: ind.title ?? "",
    fullName: ind.fullName ?? "",
    streetAddress: ind.streetAddress ?? "",
    streetAddressLine2: ind.streetAddressLine2 ?? "",
    taxFileNumber: ind.taxFileNumber ?? "",
    dateOfBirth: ind.dateOfBirth ?? "",
    countryOfBirth: ind.countryOfBirth ?? "",
    city: ind.city ?? "",
    occupation: ind.occupation ?? "",
    employer: ind.employer ?? "",
    email: ind.email ?? "",
  }));

  const hasAdv = state.hasInvestmentAdviser === true;
  const isAdviserRepresentative = state.applicantRole === APPLICANT_ROLE_ADVISER_REPRESENTATIVE;
  return {
    hasInvestmentAdviser: hasAdv,
    primaryContactName: state.primaryContactName,
    email: state.email,
    phone: state.phone,
    postalAddress: state.postalAddress ?? "",
    applicantRole: state.applicantRole,
    representativeAuthorityConfirmed: isAdviserRepresentative
      ? state.representativeAuthorityConfirmed === true
      : undefined,
    adviserDetails: state.adviserDetails ?? "",
    groupName: state.groupName ?? "",
    servicesComments: state.servicesComments ?? "",
    entities,
    individuals,
    adviserName: hasAdv ? (state.adviserName ?? "") : "",
    adviserCompany: hasAdv ? (state.adviserCompany ?? "") : "",
    adviserAddress: hasAdv ? (state.adviserAddress ?? "") : "",
    adviserTel: hasAdv ? (state.adviserTel ?? "") : "",
    adviserFax: hasAdv ? (state.adviserFax ?? "") : "",
    adviserEmail: hasAdv ? (state.adviserEmail ?? "") : "",
    nominateAdviserPrimaryContact: hasAdv ? state.nominateAdviserPrimaryContact : "",
    authoriseAdviserAccessStatements: hasAdv ? state.authoriseAdviserAccessStatements : "",
    authoriseDealWithAdviserDirect: hasAdv ? state.authoriseDealWithAdviserDirect : "",
    annualReportSendTo: state.annualReportSendTo === "" ? "" : state.annualReportSendTo,
    meetingProxySendTo: state.meetingProxySendTo === "" ? "" : state.meetingProxySendTo,
    investmentOffersSendTo: state.investmentOffersSendTo === "" ? "" : state.investmentOffersSendTo,
    dividendPreference: state.dividendPreference,
  };
}
