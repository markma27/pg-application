export const ENTITY_BASE_FEES = {
  individual: 1800,
  company: 1800,
  trust: 1800,
  smsf: 1800,
} as const;

export const COMPLEXITY_POINTS = {
  listedInvestment: 1,
  unlistedInvestment: 3,
  investmentProperty: 6,
  wrapAccount: 5,
} as const;

export const COMPLEXITY_BANDS = [
  { min: 0, max: 10, annualFee: 0, pricingStatus: "indicative" },
  { min: 11, max: 20, annualFee: 700, pricingStatus: "indicative" },
  { min: 21, max: 30, annualFee: 1300, pricingStatus: "indicative" },
  { min: 31, max: 40, annualFee: 2000, pricingStatus: "indicative" },
  { min: 41, max: 50, annualFee: 2800, pricingStatus: "indicative" },
  { min: 51, max: Number.POSITIVE_INFINITY, annualFee: 0, pricingStatus: "manual_review" },
] as const;

export const REPORTING_ADD_ONS = {
  quarterly_reporting: 1200,
  monthly_reporting: 3000,
} as const;

export const OTHER_ADD_ONS = {
  bas: 900,
  asic_agent: 300,
} as const;

export const ONBOARDING_FEES = {
  new: 750,
  existing_clean: 1500,
  existing_reconciliation: 2500,
} as const;

export const JM_ONLY_SERVICES = new Set([
  "customised_reporting",
  "acnc_ais",
  "responsible_person",
  "audit_liaison",
  "franking_credit_refund_support",
  "sub_fund_monthly_statements",
]);
