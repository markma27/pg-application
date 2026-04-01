import { APPLICANT_ROLE_ADVISER_REPRESENTATIVE, type EntityInput } from "@pg/shared";

/** Service codes always included for all entities (portfolio standard) */
export const STANDARD_SERVICE_CODES: EntityInput["serviceCodes"][number][] = [
  "standard_investment_administration",
  "standard_investment_reporting",
  "annual_reporting",
];

/** Add-on services (Jaquillard Minns) – included when selected */
export const ADD_ON_SERVICE_CODES = [
  "monthly_reporting",
  "quarterly_reporting",
  "asic_agent",
  "bas",
] as const satisfies readonly EntityInput["serviceCodes"][number][];

/** PAF & PuAF services (Jaquillard Minns) – included when selected */
export const PAF_PUAF_SERVICE_CODES = [
  "acnc_ais",
  "responsible_person",
  "franking_credit_refund_support",
  "sub_fund_monthly_statements",
] as const satisfies readonly EntityInput["serviceCodes"][number][];

/** Labels for add-on services (for review step) */
export const ADD_ON_SERVICE_LABELS: Record<(typeof ADD_ON_SERVICE_CODES)[number], string> = {
  monthly_reporting: "Monthly investment reporting",
  quarterly_reporting: "Quarterly investment reporting",
  asic_agent: "ASIC agent for companies",
  bas: "Business activity statement",
};

/** Labels for PAF & PuAF services (for review step) */
export const PAF_PUAF_SERVICE_LABELS: Record<(typeof PAF_PUAF_SERVICE_CODES)[number], string> = {
  /** Stored as one code; use {@link expandPafPuafDisplayLabels} for admin UI as two items. */
  acnc_ais: "Annual financial statements / Annual information statement",
  responsible_person: "PAF responsible person services",
  franking_credit_refund_support: "Franking credit refund application",
  sub_fund_monthly_statements: "PuAF sub-fund monthly statements",
};

/** One code (`acnc_ais`) covers two toggles — show two lines in admin summaries. */
export function expandPafPuafDisplayLabels(
  code: (typeof PAF_PUAF_SERVICE_CODES)[number],
  storedLabel?: string | null,
): string[] {
  if (code === "acnc_ais") {
    return ["Annual financial statements", "Annual information statement"];
  }
  const label = storedLabel?.trim() || PAF_PUAF_SERVICE_LABELS[code];
  return [label];
}

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
  { value: "paf", label: "PAF", description: "Private ancillary fund", letter: "E" },
  { value: "puaf", label: "PuAF", description: "Public ancillary fund", letter: "F" },
];

export const PORTFOLIO_STATUS_OPTIONS: {
  value: EntityInput["portfolioStatus"];
  label: string;
  footnote?: string;
}[] = [
  { value: "new", label: "New portfolio", footnote: "To be established" },
  { value: "existing_clean", label: "Existing portfolio", footnote: "Portfolio already in place" },
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
  APPLICANT_ROLE_ADVISER_REPRESENTATIVE,
  "Other",
];

export const MIN_ENTITIES = 1;
export const MAX_ENTITIES = 6;

export const MIN_INDIVIDUALS = 1;
export const MAX_INDIVIDUALS = 4;
