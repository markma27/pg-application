import {
  APPLICANT_ROLE_ADVISER_REPRESENTATIVE,
  assessEntity,
  entityAnnualOngoingBasePlusComplexity,
  mergePricingModelWithDefaults,
  type EntityInput,
  type FullApplicationSubmission,
  type PricingModel,
} from "@pg/shared";
import {
  ADD_ON_SERVICE_CODES,
  ADD_ON_SERVICE_LABELS,
  PAF_PUAF_SERVICE_CODES,
  SERVICE_OPTIONS,
  STANDARD_SERVICE_CODES,
  expandPafPuafDisplayLabels,
} from "@/lib/application-form/constants";
import {
  AdminReviewFieldGrid,
  AdminReviewServiceList,
  AdminSectionHeader,
  entityTypeLabel,
  portfolioLabel,
  relationshipLabel,
  ReviewRow,
  ReviewRowAlways,
} from "@/components/admin-application-review-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdminPortfolioDocumentsList, type PortfolioDocRow } from "@/components/admin-portfolio-documents";
import { formatDocumentSendToDisplay } from "@/lib/application-form/format-document-send";

function serviceOptionLabel(code: string): string {
  const fromTable = SERVICE_OPTIONS.find((o) => o.value === code)?.label;
  if (fromTable) return fromTable;
  return code
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Legacy submissions omit `hasInvestmentAdviser`; infer from any adviser field when unset. */
function hasInvestmentAdviserFromPayload(data: FullApplicationSubmission): boolean {
  if (typeof data.hasInvestmentAdviser === "boolean") {
    return data.hasInvestmentAdviser;
  }
  return !!(
    data.adviserName?.trim() ||
    data.adviserCompany?.trim() ||
    data.adviserAddress?.trim() ||
    data.adviserEmail?.trim() ||
    data.adviserTel?.trim()
  );
}

function formatOtherAssets(e: EntityInput): string | undefined {
  const parts = [
    e.hasCrypto && "Crypto/alternatives",
    e.hasForeignInvestments && "Foreign investments",
    e.otherAssetsText?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

function audWhole(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Base + complexity surcharge only (excludes reporting, BAS, ASIC, onboarding). */
function indicativeAnnualOngoingServiceFeeDisplay(entity: EntityInput, model: PricingModel): string {
  const core = entityAnnualOngoingBasePlusComplexity(entity, model);
  if (core !== null) {
    return audWhole(core);
  }
  const a = assessEntity(entity, model);
  if (a.routingOutcome === "jm_fit") {
    return "Not applicable (JM referral)";
  }
  if (a.routingOutcome === "manual_review" || a.pricingStatus === "manual_review") {
    return "Not available — manual review";
  }
  if (a.pricingStatus === "review_required") {
    return "Not available — review required";
  }
  return "Not available";
}

function partitionServiceCodes(codes: EntityInput["serviceCodes"]) {
  const set = new Set(codes);
  const addon = ADD_ON_SERVICE_CODES.filter((c) => set.has(c)).map((c) => ADD_ON_SERVICE_LABELS[c]);
  const paf = PAF_PUAF_SERVICE_CODES.filter((c) => set.has(c)).flatMap((c) => expandPafPuafDisplayLabels(c));
  const known = new Set<string>([
    ...STANDARD_SERVICE_CODES,
    ...ADD_ON_SERVICE_CODES,
    ...PAF_PUAF_SERVICE_CODES,
  ]);
  const other = codes.filter((c) => !known.has(c)).map((c) => serviceOptionLabel(c));
  return { addon, paf, other };
}

/** Renders the full validated form payload — layout aligned with the public “Review and summary” step. */
export function AdminFormSubmissionDetails({
  data,
  applicationId,
  portfolioDocumentsByEntityId,
  pricingModel: pricingModelProp,
}: {
  data: FullApplicationSubmission;
  applicationId: string;
  /** Uploaded portfolio files keyed by form entity id (`entity.id` in payload). */
  portfolioDocumentsByEntityId?: Record<string, PortfolioDocRow[]>;
  /** Saved admin pricing calculator model; defaults used if omitted. */
  pricingModel?: PricingModel;
}) {
  const pricingModel = pricingModelProp ?? mergePricingModelWithDefaults({});
  const firstEntity = data.entities[0];
  const serviceCodes = firstEntity?.serviceCodes ?? [];
  const { addon, paf, other } = partitionServiceCodes(serviceCodes);
  const commencement = firstEntity?.commencementDate ?? "—";
  const showAdviserDetailFields = hasInvestmentAdviserFromPayload(data);

  return (
    <div className="space-y-6">
      {/* Contact */}
      <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
          <AdminSectionHeader title="Contact" subtitle="Primary applicant — from submission payload" />
        </CardHeader>
        <CardContent className="px-6 py-4">
          <AdminReviewFieldGrid>
            <ReviewRow label="Name" value={data.primaryContactName} />
            <ReviewRow label="Email" value={data.email} />
            <ReviewRow label="Phone" value={data.phone} />
            <ReviewRow label="Postal address" value={data.postalAddress?.trim() || undefined} />
            <ReviewRow label="Role" value={data.applicantRole} />
            {data.applicantRole === APPLICANT_ROLE_ADVISER_REPRESENTATIVE && data.representativeAuthorityConfirmed ? (
              <ReviewRow label="Representative authority" value="Confirmed — authority to submit on behalf of the client" />
            ) : null}
            <ReviewRow label="Group name" value={data.groupName?.trim() || undefined} />
            <ReviewRow label="Adviser (intro)" value={data.adviserDetails?.trim() || undefined} />
          </AdminReviewFieldGrid>
        </CardContent>
      </Card>

      {/* Entities */}
      {data.entities.map((entity, i) => {
        const entityDocs = portfolioDocumentsByEntityId?.[entity.id];
        return (
        <Card key={entity.id} className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
          <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
            <AdminSectionHeader title={`Entity ${i + 1}`} subtitle="Entity & portfolio details" />
          </CardHeader>
          <CardContent className="px-6 py-4">
            <AdminReviewFieldGrid>
              <ReviewRow label="Entity name" value={entity.entityName || undefined} />
              <ReviewRow label="Entity type" value={entity.entityType ? entityTypeLabel(entity.entityType) : undefined} />
              <ReviewRow
                label="Portfolio status"
                value={entity.portfolioStatus ? portfolioLabel(entity.portfolioStatus) : undefined}
              />
              <ReviewRow label="Portfolio HIN" value={entity.portfolioHin?.trim() || undefined} />
              <ReviewRow label="ABN" value={entity.abn?.trim() || undefined} />
              <ReviewRow label="TFN" value={entity.tfn?.trim() || undefined} />
              <ReviewRow
                label="Registered for GST"
                value={
                  entity.registeredForGst === true ? "Yes" : entity.registeredForGst === false ? "No" : undefined
                }
              />
              <ReviewRow
                label="Primary bank account"
                value={
                  entity.hasPrimaryBankAccount === true ? "Yes" : entity.hasPrimaryBankAccount === false ? "No" : undefined
                }
              />
              {entity.hasPrimaryBankAccount === true ? (
                <>
                  <ReviewRow label="Bank name" value={entity.primaryBankName?.trim() || undefined} />
                  <ReviewRow label="Account name" value={entity.primaryBankAccountName?.trim() || undefined} />
                  <ReviewRow label="BSB" value={entity.primaryBankBsb?.replace(/\s/g, "") || undefined} />
                  <ReviewRow
                    label="Account number"
                    value={entity.primaryBankAccountNumber?.replace(/\s/g, "") || undefined}
                  />
                </>
              ) : null}
            </AdminReviewFieldGrid>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5">
              <div className="mb-3 border-b border-slate-200/80 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Holdings &amp; account counts</h3>
                <p className="mt-0.5 text-xs leading-snug text-slate-600">
                  Listed and unlisted investments, property, wrap, banking, loans, and cryptocurrencies. The indicative
                  annual ongoing service fee below is entity base plus complexity surcharge only (saved admin pricing
                  model); it excludes onboarding, extra reporting, BAS, and ASIC agent.
                </p>
              </div>
              <AdminReviewFieldGrid>
                <ReviewRow
                  label="Listed investments"
                  value={entity.listedInvestmentCount != null ? String(entity.listedInvestmentCount) : undefined}
                />
                <ReviewRow
                  label="Unlisted investments"
                  value={entity.unlistedInvestmentCount != null ? String(entity.unlistedInvestmentCount) : undefined}
                />
                <ReviewRow
                  label="Property"
                  value={entity.propertyCount != null ? String(entity.propertyCount) : undefined}
                />
                <ReviewRow label="Wrap" value={entity.wrapCount != null ? String(entity.wrapCount) : undefined} />
                <ReviewRow
                  label="Bank accounts"
                  value={entity.bankAccountCount != null ? String(entity.bankAccountCount) : undefined}
                />
                <ReviewRow
                  label="Foreign bank accounts"
                  value={entity.foreignBankAccountCount != null ? String(entity.foreignBankAccountCount) : undefined}
                />
                <ReviewRow label="Loans" value={entity.loanCount != null ? String(entity.loanCount) : undefined} />
                <ReviewRow
                  label="Cryptocurrencies"
                  value={entity.cryptocurrencyCount != null ? String(entity.cryptocurrencyCount) : undefined}
                />
              </AdminReviewFieldGrid>
              <div className="mt-4 border-t border-slate-200/90 pt-4">
                <ReviewRowAlways
                  label="Indicative annual ongoing service fee"
                  value={indicativeAnnualOngoingServiceFeeDisplay(entity, pricingModel)}
                />
              </div>
            </div>

            <div className="mt-4">
              <ReviewRow label="Other assets" value={formatOtherAssets(entity)} />
            </div>
            {entityDocs && entityDocs.length > 0 ? (
              <AdminPortfolioDocumentsList
                applicationId={applicationId}
                documents={entityDocs}
                variant="embedded"
              />
            ) : null}
          </CardContent>
        </Card>
        );
      })}

      {/* Services & commencement */}
      <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
          <AdminSectionHeader
            title="Services & commencement"
            subtitle="Group-wide — standard, add-ons, PAF/PuAF, commencement"
          />
        </CardHeader>
        <CardContent className="px-6 py-4">
          <AdminReviewFieldGrid>
            <ReviewRowAlways
              label="Portfolio add-on services (Jaquillard Minns)"
              value={<AdminReviewServiceList items={addon} />}
            />
            <ReviewRowAlways
              label="PAF & PuAF services (Jaquillard Minns)"
              value={<AdminReviewServiceList items={paf} />}
            />
            {other.length > 0 ? (
              <ReviewRowAlways label="Additional services" value={<AdminReviewServiceList items={other} />} />
            ) : null}
            <ReviewRow label="Other comments or notes" value={data.servicesComments?.trim() || undefined} />
            <ReviewRow label="Preferred commencement" value={commencement !== "—" ? commencement : undefined} />
          </AdminReviewFieldGrid>
        </CardContent>
      </Card>

      {/* Individuals */}
      {data.individuals.map((ind, i) => (
        <Card key={ind.id} className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
          <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
            <AdminSectionHeader
              title={`Know Your Customer (KYC) – Individual ${i + 1}`}
              subtitle="KYC / identity"
            />
          </CardHeader>
          <CardContent className="px-6 py-4">
            <AdminReviewFieldGrid>
              <ReviewRow
                label="Name"
                value={[ind.title, ind.fullName].filter(Boolean).join(" ") || undefined}
              />
              <ReviewRow
                label="Relationship to account"
                value={
                  ind.relationshipRoles?.length
                    ? ind.relationshipRoles.map(relationshipLabel).join(", ")
                    : undefined
                }
              />
              <ReviewRow
                label="Residential address"
                value={[ind.streetAddress, ind.streetAddressLine2].filter(Boolean).join(", ") || undefined}
              />
              <ReviewRow label="Tax File Number" value={ind.taxFileNumber || undefined} />
              <ReviewRow label="Date of birth" value={ind.dateOfBirth || undefined} />
              <ReviewRow label="Country of birth" value={ind.countryOfBirth || undefined} />
              <ReviewRow label="City of birth" value={ind.city || undefined} />
              <ReviewRow label="Occupation" value={ind.occupation || undefined} />
              <ReviewRow label="Employer" value={ind.employer || undefined} />
              <ReviewRow label="Email" value={ind.email || undefined} />
            </AdminReviewFieldGrid>
          </CardContent>
        </Card>
      ))}

      {/* Adviser & administration */}
      <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
          <AdminSectionHeader
            title="Investment adviser & administration"
            subtitle="Adviser firm, authorisations, document routing, dividend"
          />
        </CardHeader>
        <CardContent className="px-6 py-4">
          <AdminReviewFieldGrid>
            <ReviewRow
              label="Has investment adviser"
              value={showAdviserDetailFields ? "Yes" : "No"}
            />
            {showAdviserDetailFields ? (
              <>
                <ReviewRow label="Adviser name" value={data.adviserName?.trim() || undefined} />
                <ReviewRow label="Company" value={data.adviserCompany?.trim() || undefined} />
                <ReviewRow label="Adviser address" value={data.adviserAddress?.trim() || undefined} />
                <ReviewRow label="Phone" value={data.adviserTel?.trim() || undefined} />
                <ReviewRow label="Fax" value={data.adviserFax?.trim() || undefined} />
                <ReviewRow label="Email" value={data.adviserEmail?.trim() || undefined} />
                <ReviewRow
                  label="Nominate adviser as primary contact"
                  value={
                    data.nominateAdviserPrimaryContact === true
                      ? "Yes"
                      : data.nominateAdviserPrimaryContact === false
                        ? "No"
                        : undefined
                  }
                />
                <ReviewRow
                  label="Authorise adviser access to statements"
                  value={
                    data.authoriseAdviserAccessStatements === true
                      ? "Yes"
                      : data.authoriseAdviserAccessStatements === false
                        ? "No"
                        : undefined
                  }
                />
                <ReviewRow
                  label="Authorise deal with adviser direct"
                  value={
                    data.authoriseDealWithAdviserDirect === true
                      ? "Yes"
                      : data.authoriseDealWithAdviserDirect === false
                        ? "No"
                        : undefined
                  }
                />
              </>
            ) : null}
            <ReviewRow label="Annual report send to" value={formatDocumentSendToDisplay(data.annualReportSendTo)} />
            <ReviewRow label="Meeting proxy send to" value={formatDocumentSendToDisplay(data.meetingProxySendTo)} />
            <ReviewRow label="Investment offers send to" value={formatDocumentSendToDisplay(data.investmentOffersSendTo)} />
            <ReviewRow
              label="Dividend preference"
              value={
                data.dividendPreference === "cash"
                  ? "Receive in cash"
                  : data.dividendPreference === "reinvest"
                    ? "Re-invest"
                    : undefined
              }
            />
          </AdminReviewFieldGrid>
        </CardContent>
      </Card>
    </div>
  );
}
