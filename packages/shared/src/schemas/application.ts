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
  phone: z.string().min(1, "Phone is required"),
  applicantRole: z.string().min(1, "Applicant role is required"),
  adviserDetails: z.string().optional().default(""),
  groupName: z.string().optional().default(""),
  entities: z.array(entityInputSchema).min(1, "At least one entity is required"),
});

export type EntityInput = z.infer<typeof entityInputSchema>;
export type ApplicationInput = z.infer<typeof applicationInputSchema>;

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
