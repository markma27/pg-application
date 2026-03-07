import type { EntityInput } from "@pg/shared";

export const ENTITY_TYPE_OPTIONS: {
  value: EntityInput["entityType"];
  label: string;
  description: string;
  letter: string;
}[] = [
  { value: "individual", label: "Individual", description: "Personal investment account", letter: "A" },
  { value: "trust", label: "Trust", description: "Family trust or unit trust", letter: "B" },
  { value: "company", label: "Company", description: "Corporate entity", letter: "C" },
  { value: "smsf", label: "SMSF", description: "Self-managed super fund", letter: "D" },
  { value: "paf", label: "PAF", description: "Private ancillary fund (JM)", letter: "E" },
  { value: "puaf", label: "PuAF", description: "Public ancillary fund (JM)", letter: "F" },
];

export const PORTFOLIO_STATUS_OPTIONS: { value: EntityInput["portfolioStatus"]; label: string }[] = [
  { value: "new", label: "New portfolio" },
  { value: "existing_clean", label: "Existing clean portfolio" },
  { value: "existing_reconciliation", label: "Existing with reconciliation" },
  { value: "complex_cleanup", label: "Complex cleanup (manual review)" },
];

export const SERVICE_OPTIONS: { value: EntityInput["serviceCodes"][number]; label: string; jmOnly?: boolean }[] = [
  { value: "standard_investment_administration", label: "Standard investment administration" },
  { value: "standard_investment_reporting", label: "Standard investment reporting" },
  { value: "annual_reporting", label: "Annual reporting (included)" },
  { value: "quarterly_reporting", label: "Quarterly reporting" },
  { value: "monthly_reporting", label: "Monthly reporting" },
  { value: "customised_reporting", label: "Customised reporting", jmOnly: true },
  { value: "bas", label: "BAS" },
  { value: "asic_agent", label: "ASIC agent" },
  { value: "acnc_ais", label: "ACNC AIS", jmOnly: true },
  { value: "responsible_person", label: "Responsible person", jmOnly: true },
  { value: "audit_liaison", label: "Audit liaison", jmOnly: true },
  { value: "franking_credit_refund_support", label: "Franking credit refund support", jmOnly: true },
  { value: "sub_fund_monthly_statements", label: "Sub-fund monthly statements", jmOnly: true },
];

export const APPLICANT_ROLE_OPTIONS = [
  "Owner",
  "Director",
  "Trustee",
  "Adviser / representative",
  "Other",
];

export const MIN_ENTITIES = 1;
export const MAX_ENTITIES = 6;
