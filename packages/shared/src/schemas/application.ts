import { z } from "zod";

export const entityTypeSchema = z.enum([
  "individual",
  "company",
  "trust",
  "smsf",
  "paf",
  "puaf",
]);

export const portfolioStatusSchema = z.enum([
  "new",
  "existing_clean",
  "existing_reconciliation",
  "complex_cleanup",
]);

export const serviceCodeSchema = z.enum([
  "standard_investment_administration",
  "standard_investment_reporting",
  "annual_reporting",
  "quarterly_reporting",
  "monthly_reporting",
  "customised_reporting",
  "bas",
  "asic_agent",
  "acnc_ais",
  "responsible_person",
  "audit_liaison",
  "franking_credit_refund_support",
  "sub_fund_monthly_statements",
]);

export const entityInputSchema = z.object({
  id: z.string().min(1),
  entityName: z.string().min(1, "Entity name is required"),
  entityType: entityTypeSchema,
  portfolioStatus: portfolioStatusSchema,
  portfolioHin: z.string().optional().default(""),
  abn: z.string().optional().default("").refine(
    (v) => v === "" || /^\d{11}$/.test(v),
    { message: "ABN must be exactly 11 digits" },
  ),
  tfn: z.string().optional().default("").refine(
    (v) => v === "" || /^\d{8,9}$/.test(v),
    { message: "TFN must be 8 or 9 digits" },
  ),
  registeredForGst: z.boolean().optional(),
  listedInvestmentCount: z.number().int().min(0),
  unlistedInvestmentCount: z.number().int().min(0),
  propertyCount: z.number().int().min(0),
  wrapCount: z.number().int().min(0),
  otherAssetsText: z.string().optional().default(""),
  hasCrypto: z.boolean().default(false),
  hasForeignInvestments: z.boolean().default(false),
  serviceCodes: z.array(serviceCodeSchema).min(1, "At least one service is required"),
  commencementDate: z.string().min(1, "Commencement date is required"),
});

export const applicationInputSchema = z.object({
  primaryContactName: z.string().min(1, "Contact name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().min(1, "Phone is required").regex(/^\d{8,15}$/, "Phone must be 8–15 digits"),
  applicantRole: z.string().min(1, "Applicant role is required"),
  adviserDetails: z.string().optional().default(""),
  groupName: z.string().optional().default(""),
  /** Optional comments or notes about services (applies to entire group) */
  servicesComments: z.string().optional().default(""),
  entities: z.array(entityInputSchema).min(1, "At least one entity is required"),
});

/** Individuals step — matches public form validation. */
export const individualRelationshipRoleSchema = z.enum([
  "individual",
  "trustee",
  "director",
  "company_secretary",
]);

export const individualInputSchema = z.object({
  id: z.string().min(1),
  relationshipRoles: z.array(individualRelationshipRoleSchema).min(1, "At least one relationship role"),
  title: z.string().min(1),
  fullName: z.string().min(1),
  streetAddress: z.string().min(1),
  streetAddressLine2: z.string().optional().default(""),
  taxFileNumber: z.string().regex(/^\d{8,9}$/, "TFN must be 8 or 9 digits"),
  dateOfBirth: z.string().min(1),
  countryOfBirth: z.string().min(1),
  city: z.string().min(1),
  occupation: z.string().min(1),
  employer: z.string().min(1),
  email: z.email("Valid email is required"),
});

/** Document routing checkboxes: trustee/adviser, not required, or unset. */
export const documentSendToValueSchema = z.union([
  z.array(z.enum(["trustee", "adviser"])),
  z.literal("not_required"),
  z.literal(""),
]);

/**
 * Full public form POST body: core pricing/entities plus individuals, adviser, and admin preferences.
 */
export const fullApplicationSubmissionSchema = applicationInputSchema.extend({
  individuals: z.array(individualInputSchema).min(1).max(4),
  adviserName: z.string().optional().default(""),
  adviserCompany: z.string().optional().default(""),
  adviserAddress: z.string().optional().default(""),
  adviserTel: z.string().optional().default(""),
  adviserFax: z.string().optional().default(""),
  adviserEmail: z.string().optional().default(""),
  nominateAdviserPrimaryContact: z.union([z.boolean(), z.literal("")]).optional(),
  authoriseAdviserAccessStatements: z.union([z.boolean(), z.literal("")]).optional(),
  authoriseDealWithAdviserDirect: z.union([z.boolean(), z.literal("")]).optional(),
  annualReportSendTo: documentSendToValueSchema.optional().default(""),
  meetingProxySendTo: documentSendToValueSchema.optional().default(""),
  investmentOffersSendTo: documentSendToValueSchema.optional().default(""),
  dividendPreference: z.union([z.literal("cash"), z.literal("reinvest"), z.literal("")]).optional().default(""),
});

export type EntityInput = z.infer<typeof entityInputSchema>;
export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type IndividualInput = z.infer<typeof individualInputSchema>;
export type FullApplicationSubmission = z.infer<typeof fullApplicationSubmissionSchema>;

/** Strip extended fields for pricing / assessment (unchanged behaviour). */
export function toApplicationInput(full: FullApplicationSubmission): ApplicationInput {
  return {
    primaryContactName: full.primaryContactName,
    email: full.email,
    phone: full.phone,
    applicantRole: full.applicantRole,
    adviserDetails: full.adviserDetails,
    groupName: full.groupName,
    servicesComments: full.servicesComments,
    entities: full.entities,
  };
}

export type RoutingOutcome = "pg_fit" | "jm_fit" | "manual_review";
export type PricingStatus = "indicative" | "review_required" | "manual_review" | "not_available";

export interface EntityAssessment {
  entityId: string;
  entityName: string;
  entityType: EntityInput["entityType"];
  routingOutcome: RoutingOutcome;
  pricingStatus: PricingStatus;
  complexityPoints: number;
  annualFeeEstimate: number | null;
  onboardingFeeEstimate: number | null;
  jmReasons: string[];
  reviewReasons: string[];
}

export interface ApplicationAssessment {
  overallOutcome: RoutingOutcome;
  indicativePricingAvailable: boolean;
  annualSubtotal: number;
  onboardingSubtotal: number;
  groupDiscountAmount: number;
  totalEstimate: number | null;
  requiresJmFollowUp: boolean;
  requiresManualReview: boolean;
  entityAssessments: EntityAssessment[];
}
