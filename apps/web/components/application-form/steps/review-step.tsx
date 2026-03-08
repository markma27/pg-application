"use client";

import { useApplicationForm } from "@/lib/application-form";
import { ENTITY_TYPE_OPTIONS, PORTFOLIO_STATUS_OPTIONS, SERVICE_OPTIONS } from "@/lib/application-form/constants";
import type { DocumentSendTo } from "@/lib/application-form/types";
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

const DOCUMENT_SEND_LABELS: Record<DocumentSendTo, string> = {
  trustee: "Trustee",
  adviser: "Adviser",
  not_required: "Not required",
};

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
  const serviceLabel = (value: string) => SERVICE_OPTIONS.find((o) => o.value === value)?.label ?? value;
  const relationshipLabel = (r: string) => r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
              subtitle="Applies to all entities in this application"
              onEdit={() => goToStep(servicesStepIndex)}
              editStepLabel="Edit services & commencement"
            />
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 px-6 py-4">
            <ReviewRow
              label="Services"
              value={
                state.groupServiceCodes?.length
                  ? state.groupServiceCodes.map(serviceLabel).join(", ")
                  : undefined
              }
            />
            <ReviewRow label="Commencement date" value={state.groupCommencementDate || undefined} />
          </CardContent>
        </Card>

        {/* Individuals */}
        {state.individuals.slice(0, state.individualCount).map((ind, i) => (
          <Card key={ind.id} className="overflow-hidden rounded-xl border border-slate-200 pt-0 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60 pl-6 pr-6 py-4">
              <SectionHeader
                title={`Individual ${i + 1}`}
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
                label="Address"
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

        {/* Adviser & administration */}
        <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pl-6 pr-6 py-4">
            <SectionHeader
              title="Adviser & administration"
              subtitle="Investment adviser and document preferences"
              onEdit={() => goToStep(adviserDetailsStepIndex)}
              editStepLabel="Edit adviser & administration"
            />
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 px-6 py-4">
            <ReviewRow label="Adviser name" value={state.adviserName || undefined} />
            <ReviewRow label="Company" value={state.adviserCompany || undefined} />
            <ReviewRow label="Address" value={state.adviserAddress || undefined} />
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
            <ReviewRow
              label="Annual report send to"
              value={state.annualReportSendTo ? DOCUMENT_SEND_LABELS[state.annualReportSendTo] : undefined}
            />
            <ReviewRow
              label="Meeting proxy send to"
              value={state.meetingProxySendTo ? DOCUMENT_SEND_LABELS[state.meetingProxySendTo] : undefined}
            />
            <ReviewRow
              label="Investment offers send to"
              value={state.investmentOffersSendTo ? DOCUMENT_SEND_LABELS[state.investmentOffersSendTo] : undefined}
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
