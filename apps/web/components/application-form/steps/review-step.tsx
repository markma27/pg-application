"use client";

import { useApplicationForm } from "@/lib/application-form";
import {
  ADD_ON_SERVICE_LABELS,
  ENTITY_TYPE_OPTIONS,
  PORTFOLIO_STATUS_OPTIONS,
} from "@/lib/application-form/constants";
import { formatDocumentSendToDisplay } from "@/lib/application-form/format-document-send";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil } from "lucide-react";

const ENTITY_STEPS_START = 2;
const ENTITY_STEPS_PER_ENTITY = 2;

function ReviewRow({ label, value, className = "" }: { label: string; value: React.ReactNode; className?: string }) {
  if (value == null || value === "") return null;
  return (
    <div className={`grid grid-cols-1 gap-1 py-2 sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-4 sm:py-2.5 ${className}`}>
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  onEdit,
  editStepLabel,
}: {
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  editStepLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
        {subtitle && <CardDescription className="mt-0.5 text-slate-600">{subtitle}</CardDescription>}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:mt-0"
          aria-label={editStepLabel}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      )}
    </div>
  );
}

export function ReviewStep() {
  const { state, goToStep, servicesStepIndex, individualDetailsStepIndex, adviserDetailsStepIndex } = useApplicationForm();

  const entityTypeLabel = (value: string) => ENTITY_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
  const portfolioLabel = (value: string) => PORTFOLIO_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
  const relationshipLabel = (r: string) => r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const kycIndividualTitle = (n: number) => `Know Your Customer (KYC) – Individual ${n}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Review and summary</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Please confirm your details before submitting. Use Edit on any section to make changes.
        </p>
      </div>

      <div className="space-y-6">
        {/* Contact details */}
        <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pl-6 pr-6 py-4">
            <SectionHeader
              title="Contact details"
              onEdit={() => goToStep(0)}
              editStepLabel="Edit contact details"
            />
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 px-6 py-4">
            <ReviewRow label="Name" value={state.primaryContactName} />
            <ReviewRow label="Email" value={state.email} />
            <ReviewRow label="Phone" value={state.phone} />
            <ReviewRow label="Role" value={state.applicantRole} />
            <ReviewRow label="Group name" value={state.groupName || undefined} />
            <ReviewRow label="Adviser (intro)" value={state.adviserDetails || undefined} />
          </CardContent>
        </Card>

        {/* Entities */}
        {state.entities.slice(0, state.entityCount).map((entity, i) => {
          const firstStepForEntity = ENTITY_STEPS_START + i * ENTITY_STEPS_PER_ENTITY;
          return (
            <Card key={entity.id} className="overflow-hidden rounded-xl border border-slate-200 pt-0 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/60 pl-6 pr-6 py-4">
                <SectionHeader
                  title={`Entity ${i + 1}`}
                  onEdit={() => goToStep(firstStepForEntity)}
                  editStepLabel={`Edit entity ${i + 1}`}
                />
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 px-6 py-4">
                <ReviewRow label="Entity name" value={entity.entityName || undefined} />
                <ReviewRow
                  label="Entity type"
                  value={entity.entityType ? entityTypeLabel(entity.entityType) : undefined}
                />
                <ReviewRow
                  label="Portfolio status"
                  value={entity.portfolioStatus ? portfolioLabel(entity.portfolioStatus) : undefined}
                />
                {(entity.existingPortfolioReportFiles?.length ?? 0) > 0 ? (
                  <ReviewRow
                    label="Portfolio documents"
                    value={
                      <span className="block">
                        {(entity.existingPortfolioReportFiles ?? []).map((f) => f.name).join(", ")}
                      </span>
                    }
                  />
                ) : null}
                <ReviewRow label="Portfolio HIN" value={entity.portfolioHin || undefined} />
                <ReviewRow label="ABN" value={entity.abn || undefined} />
                <ReviewRow label="TFN" value={entity.tfn || undefined} />
                <ReviewRow
                  label="Registered for GST"
                  value={entity.registeredForGst === true ? "Yes" : entity.registeredForGst === false ? "No" : undefined}
                />
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
                  label="Other assets"
                  value={
                    entity.hasCrypto || entity.hasForeignInvestments || entity.otherAssetsText
                      ? [
                          entity.hasCrypto && "Crypto/alternatives",
                          entity.hasForeignInvestments && "Foreign investments",
                          entity.otherAssetsText,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          );
        })}

        {/* Services & commencement (client group) */}
        <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pl-6 pr-6 py-4">
            <SectionHeader
              title="Services & commencement"
              subtitle="Services and preferred commencement apply to the entire group"
              onEdit={() => goToStep(servicesStepIndex)}
              editStepLabel="Edit services & commencement"
            />
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 px-6 py-4">
            <ReviewRow label="Portfolio standard services" value="Included" />
            <ReviewRow
              label="Portfolio add-on services (Jaquillard Minns)"
              value={
                state.selectedAddOnServiceCodes?.length
                  ? state.selectedAddOnServiceCodes
                      .map((c) => ADD_ON_SERVICE_LABELS[c as keyof typeof ADD_ON_SERVICE_LABELS])
                      .filter(Boolean)
                      .join(", ")
                  : "None"
              }
            />
            <ReviewRow
              label="PAF & PuAF services (Jaquillard Minns)"
              value={
                (() => {
                  const t = state.pafPuafServiceToggles;
                  if (!t) return "None";
                  const labels: string[] = [];
                  if (t.annualFinancialStatements) labels.push("Annual financial statements");
                  if (t.annualInformationStatement) labels.push("Annual information statement");
                  if (t.frankingCreditRefundApplication) labels.push("Franking credit refund application");
                  if (t.pafResponsiblePersonServices) labels.push("PAF responsible person services");
                  if (t.puafSubFundMonthlyStatements) labels.push("PuAF sub-fund monthly statements");
                  return labels.length ? labels.join(", ") : "None";
                })()
              }
            />
            <ReviewRow label="Other comments or notes" value={state.servicesComments?.trim() || undefined} />
            <ReviewRow label="Preferred commencement" value={state.groupCommencementDate || undefined} />
          </CardContent>
        </Card>

        {/* Individuals */}
        {state.individuals.slice(0, state.individualCount).map((ind, i) => (
          <Card key={ind.id} className="overflow-hidden rounded-xl border border-slate-200 pt-0 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60 pl-6 pr-6 py-4">
              <SectionHeader
                title={kycIndividualTitle(i + 1)}
                subtitle="KYC / identity"
                onEdit={() => goToStep(individualDetailsStepIndex)}
                editStepLabel="Edit individual details"
              />
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 px-6 py-4">
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
            </CardContent>
          </Card>
        ))}

        {/* Investment adviser & administration */}
        <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pl-6 pr-6 py-4">
            <SectionHeader
              title="Investment adviser & administration"
              subtitle="Investment adviser, document routing (Individual / Adviser), dividend preference"
              onEdit={() => goToStep(adviserDetailsStepIndex)}
              editStepLabel="Edit investment adviser and administration"
            />
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 px-6 py-4">
            <ReviewRow
              label="Has investment adviser"
              value={state.hasInvestmentAdviser === true ? "Yes" : "No"}
            />
            {state.hasInvestmentAdviser === true ? (
              <>
                <ReviewRow label="Adviser name" value={state.adviserName || undefined} />
                <ReviewRow label="Company" value={state.adviserCompany || undefined} />
                <ReviewRow label="Adviser address" value={state.adviserAddress || undefined} />
                <ReviewRow label="Phone" value={state.adviserTel || undefined} />
                <ReviewRow label="Fax" value={state.adviserFax || undefined} />
                <ReviewRow label="Email" value={state.adviserEmail || undefined} />
                <ReviewRow
                  label="Nominate adviser as primary contact"
                  value={
                    state.nominateAdviserPrimaryContact === true
                      ? "Yes"
                      : state.nominateAdviserPrimaryContact === false
                        ? "No"
                        : undefined
                  }
                />
                <ReviewRow
                  label="Authorise adviser access to statements"
                  value={
                    state.authoriseAdviserAccessStatements === true
                      ? "Yes"
                      : state.authoriseAdviserAccessStatements === false
                        ? "No"
                        : undefined
                  }
                />
                <ReviewRow
                  label="Authorise deal with adviser direct"
                  value={
                    state.authoriseDealWithAdviserDirect === true
                      ? "Yes"
                      : state.authoriseDealWithAdviserDirect === false
                        ? "No"
                        : undefined
                  }
                />
              </>
            ) : null}
            <ReviewRow
              label="Annual report send to"
              value={formatDocumentSendToDisplay(state.annualReportSendTo)}
            />
            <ReviewRow
              label="Meeting proxy send to"
              value={formatDocumentSendToDisplay(state.meetingProxySendTo)}
            />
            <ReviewRow
              label="Investment offers send to"
              value={formatDocumentSendToDisplay(state.investmentOffersSendTo)}
            />
            <ReviewRow
              label="Dividend preference"
              value={
                state.dividendPreference === "cash"
                  ? "Receive in cash"
                  : state.dividendPreference === "reinvest"
                    ? "Re-invest"
                    : undefined
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
