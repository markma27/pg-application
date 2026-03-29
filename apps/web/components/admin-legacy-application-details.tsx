import {
  ADD_ON_SERVICE_CODES,
  ADD_ON_SERVICE_LABELS,
  PAF_PUAF_SERVICE_CODES,
  PAF_PUAF_SERVICE_LABELS,
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

/** Rows from `application_individuals` (snake_case from Supabase). */
export type IndividualDbRow = {
  id: string;
  sort_order: number;
  relationship_roles: string[];
  title: string;
  full_name: string;
  street_address: string;
  street_address_line2: string | null;
  tax_file_number: string;
  date_of_birth: string;
  country_of_birth: string;
  city: string;
  occupation: string;
  employer: string;
  email: string;
};

/** Structured adviser + prefs from `applications` columns (snake_case). */
export type AdviserRelationalFields = {
  adviser_name: string | null;
  adviser_company: string | null;
  adviser_address: string | null;
  adviser_tel: string | null;
  adviser_fax: string | null;
  adviser_email: string | null;
  nominate_adviser_primary_contact: boolean | null;
  authorise_adviser_access_statements: boolean | null;
  authorise_deal_with_adviser_direct: boolean | null;
  annual_report_send_to: unknown | null;
  meeting_proxy_send_to: unknown | null;
  investment_offers_send_to: unknown | null;
  dividend_preference: string | null;
};

function formatSendToFromJsonb(val: unknown): string | undefined {
  if (val == null) return undefined;
  if (typeof val === "string") {
    if (val === "not_required") return "Not required";
    if (val === "") return undefined;
    return val;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return undefined;
    return val.map((x) => (x === "trustee" ? "Individual" : "Adviser")).join(", ");
  }
  return undefined;
}

function ynTri(v: boolean | null | undefined): string | undefined {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return undefined;
}

function hasAdviserRelationalData(a: AdviserRelationalFields): boolean {
  const texts = [
    a.adviser_name,
    a.adviser_company,
    a.adviser_address,
    a.adviser_tel,
    a.adviser_fax,
    a.adviser_email,
  ].some((t) => t?.trim());
  const bools =
    a.nominate_adviser_primary_contact != null ||
    a.authorise_adviser_access_statements != null ||
    a.authorise_deal_with_adviser_direct != null;
  const sends =
    a.annual_report_send_to != null ||
    a.meeting_proxy_send_to != null ||
    a.investment_offers_send_to != null;
  const div = a.dividend_preference?.trim();
  return texts || bools || sends || !!div;
}

export type LegacyEntityRow = {
  id: string;
  entity_name: string;
  entity_type: string;
  portfolio_status: string;
  portfolio_hin: string | null;
  abn: string | null;
  tfn: string | null;
  registered_for_gst: boolean | null;
  listed_investment_count: number;
  unlisted_investment_count: number;
  property_count: number;
  wrap_count: number;
  other_assets_text: string | null;
  has_crypto: boolean;
  has_foreign_investments: boolean;
  routing_outcome: string;
  service_start_date: string;
  complexity_points: number;
  indicative_annual_fee: string | number | null;
  indicative_onboarding_fee: string | number | null;
  pricing_status: string;
  entity_services: { id: string; service_code: string; service_label: string }[] | null;
};

function formatOtherAssetsDb(e: LegacyEntityRow): string | undefined {
  const parts = [
    e.has_crypto && "Crypto/alternatives",
    e.has_foreign_investments && "Foreign investments",
    e.other_assets_text?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

function partitionServicesFromRows(
  services: { service_code: string; service_label: string }[],
): { addon: string[]; paf: string[]; other: string[] } {
  const byCode = new Map(services.map((s) => [s.service_code, s.service_label]));
  const set = new Set(services.map((s) => s.service_code));
  const addon = ADD_ON_SERVICE_CODES.filter((c) => set.has(c)).map(
    (c) => byCode.get(c) ?? ADD_ON_SERVICE_LABELS[c as keyof typeof ADD_ON_SERVICE_LABELS],
  );
  const paf = PAF_PUAF_SERVICE_CODES.filter((c) => set.has(c)).flatMap((c) =>
    expandPafPuafDisplayLabels(c, byCode.get(c)),
  );
  const known = new Set<string>([...STANDARD_SERVICE_CODES, ...ADD_ON_SERVICE_CODES, ...PAF_PUAF_SERVICE_CODES]);
  const other = services.filter((s) => !known.has(s.service_code)).map((s) => s.service_label);
  return { addon, paf, other };
}

/**
 * Legacy applications: no `form_submission` JSON — same card layout as the public review step,
 * using relational tables only. Adviser/individual blocks explain gaps honestly.
 */
export function AdminLegacyApplicationDetails({
  primaryContactName,
  email,
  phone,
  applicantRole,
  groupName,
  adviserDetails,
  servicesComments,
  entities,
  outcomeLabel,
  kycIndividuals = [],
  adviserRelational,
}: {
  primaryContactName: string;
  email: string;
  phone: string;
  applicantRole: string;
  groupName: string | null;
  adviserDetails: string | null;
  servicesComments: string | null;
  entities: LegacyEntityRow[];
  outcomeLabel: (code: string) => string;
  kycIndividuals?: IndividualDbRow[];
  adviserRelational?: AdviserRelationalFields;
}) {
  const first = entities[0];
  const svcList = first?.entity_services ?? [];
  const { addon, paf, other } = partitionServicesFromRows(svcList);
  const commencement = first?.service_start_date;

  const hasKyc = kycIndividuals.length > 0;
  const hasAdviserCols = adviserRelational ? hasAdviserRelationalData(adviserRelational) : false;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">No full JSON snapshot on file</p>
        <p className="mt-1 text-amber-900/90">
          The complete form copy (<code className="rounded bg-amber-100/80 px-1">applications.form_submission</code>) was
          not saved for this application. Below uses relational data only (contact, entities, pricing, and — when
          present — <code className="rounded bg-amber-100/80 px-1">application_individuals</code> and adviser columns
          on <code className="rounded bg-amber-100/80 px-1">applications</code>).
        </p>
        {!hasKyc && !hasAdviserCols ? (
          <p className="mt-2 text-amber-900/90">
            This row predates those columns: only contact text <code className="rounded bg-amber-100/80 px-1">adviser_details</code> may exist.
          </p>
        ) : (
          <p className="mt-2 text-emerald-900/90">
            <span className="font-medium">Relational KYC/adviser fields:</span> {hasKyc ? `${kycIndividuals.length} individual(s)` : "none"}
            {hasKyc && hasAdviserCols ? " · " : ""}
            {hasAdviserCols ? "structured adviser & document prefs" : ""}
          </p>
        )}
      </div>

      <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
          <AdminSectionHeader title="Contact" subtitle="Primary applicant — from applications row" />
        </CardHeader>
        <CardContent className="px-6 py-4">
          <AdminReviewFieldGrid>
            <ReviewRow label="Name" value={primaryContactName} />
            <ReviewRow label="Email" value={email} />
            <ReviewRow label="Phone" value={phone} />
            <ReviewRow label="Role" value={applicantRole} />
            <ReviewRowAlways label="Group name" value={groupName?.trim() || "—"} />
            <ReviewRowAlways
              label="Adviser notes (contact step only)"
              value={adviserDetails?.trim() || "—"}
            />
          </AdminReviewFieldGrid>
        </CardContent>
      </Card>

      {entities.map((entity, i) => (
        <Card key={entity.id} className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
          <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
            <AdminSectionHeader title={`Entity ${i + 1}`} subtitle="Portfolio & complexity — from application_entities" />
          </CardHeader>
          <CardContent className="px-6 py-4">
            <AdminReviewFieldGrid>
              <ReviewRowAlways label="Assessment routing" value={outcomeLabel(entity.routing_outcome)} />
              <ReviewRow label="Entity name" value={entity.entity_name || undefined} />
              <ReviewRow
                label="Entity type"
                value={entity.entity_type ? entityTypeLabel(entity.entity_type) : undefined}
              />
              <ReviewRow
                label="Portfolio status"
                value={entity.portfolio_status ? portfolioLabel(entity.portfolio_status) : undefined}
              />
              <ReviewRow label="Portfolio HIN" value={entity.portfolio_hin?.trim() || undefined} />
              <ReviewRow label="ABN" value={entity.abn?.trim() || undefined} />
              <ReviewRow label="TFN" value={entity.tfn?.trim() || undefined} />
              <ReviewRow
                label="Registered for GST"
                value={
                  entity.registered_for_gst === true ? "Yes" : entity.registered_for_gst === false ? "No" : undefined
                }
              />
              <ReviewRow
                label="Listed investments"
                value={String(entity.listed_investment_count)}
              />
              <ReviewRow
                label="Unlisted investments"
                value={String(entity.unlisted_investment_count)}
              />
              <ReviewRow label="Property" value={String(entity.property_count)} />
              <ReviewRow label="Wrap" value={String(entity.wrap_count)} />
              <ReviewRow label="Other assets" value={formatOtherAssetsDb(entity)} />
              <ReviewRow
                label="Pricing (system)"
                value={`${entity.pricing_status.replace(/_/g, " ")} · Complexity ${entity.complexity_points}`}
              />
              <ReviewRow
                label="Indicative annual"
                value={entity.indicative_annual_fee != null ? String(entity.indicative_annual_fee) : undefined}
              />
              <ReviewRow
                label="Indicative onboarding"
                value={entity.indicative_onboarding_fee != null ? String(entity.indicative_onboarding_fee) : undefined}
              />
            </AdminReviewFieldGrid>
            {entity.entity_services && entity.entity_services.length > 0 ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {entity.entity_services.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-800"
                    >
                      {s.service_label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}

      <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
          <AdminSectionHeader
            title="Services & commencement"
            subtitle="Reconstructed from entity_services + comments (group-wide commencement)"
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
            <ReviewRow label="Other comments or notes" value={servicesComments?.trim() || undefined} />
            <ReviewRow label="Preferred commencement" value={commencement || undefined} />
          </AdminReviewFieldGrid>
        </CardContent>
      </Card>

      {hasKyc ? (
        kycIndividuals.map((ind, i) => (
          <Card key={ind.id} className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
            <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
              <AdminSectionHeader
                title={`Know Your Customer (KYC) – Individual ${i + 1}`}
                subtitle="From application_individuals (relational)"
              />
            </CardHeader>
            <CardContent className="px-6 py-4">
              <AdminReviewFieldGrid>
                <ReviewRow
                  label="Name"
                  value={[ind.title, ind.full_name].filter(Boolean).join(" ") || undefined}
                />
                <ReviewRow
                  label="Relationship to account"
                  value={
                    ind.relationship_roles?.length
                      ? ind.relationship_roles.map(relationshipLabel).join(", ")
                      : undefined
                  }
                />
                <ReviewRow
                  label="Residential address"
                  value={[ind.street_address, ind.street_address_line2].filter(Boolean).join(", ") || undefined}
                />
                <ReviewRow label="Tax File Number" value={ind.tax_file_number || undefined} />
                <ReviewRow label="Date of birth" value={ind.date_of_birth || undefined} />
                <ReviewRow label="Country of birth" value={ind.country_of_birth || undefined} />
                <ReviewRow label="City of birth" value={ind.city || undefined} />
                <ReviewRow label="Occupation" value={ind.occupation || undefined} />
                <ReviewRow label="Employer" value={ind.employer || undefined} />
                <ReviewRow label="Email" value={ind.email || undefined} />
              </AdminReviewFieldGrid>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
          <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
            <AdminSectionHeader title="Individuals (KYC)" subtitle="No rows in application_individuals" />
          </CardHeader>
          <CardContent className="px-6 py-6">
            <p className="text-sm leading-relaxed text-slate-600">
              No KYC rows for this application. New submissions persist individuals here and in{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">form_submission</code>.
            </p>
          </CardContent>
        </Card>
      )}

      {hasAdviserCols && adviserRelational ? (
        <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
          <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
            <AdminSectionHeader
              title="Investment adviser & document preferences"
              subtitle="From applications columns (relational)"
            />
          </CardHeader>
          <CardContent className="px-6 py-4">
            <AdminReviewFieldGrid>
              <ReviewRow label="Adviser name" value={adviserRelational.adviser_name?.trim() || undefined} />
              <ReviewRow label="Company" value={adviserRelational.adviser_company?.trim() || undefined} />
              <ReviewRow label="Adviser address" value={adviserRelational.adviser_address?.trim() || undefined} />
              <ReviewRow label="Phone" value={adviserRelational.adviser_tel?.trim() || undefined} />
              <ReviewRow label="Fax" value={adviserRelational.adviser_fax?.trim() || undefined} />
              <ReviewRow label="Email" value={adviserRelational.adviser_email?.trim() || undefined} />
              <ReviewRow
                label="Nominate adviser as primary contact"
                value={ynTri(adviserRelational.nominate_adviser_primary_contact)}
              />
              <ReviewRow
                label="Authorise adviser access to statements"
                value={ynTri(adviserRelational.authorise_adviser_access_statements)}
              />
              <ReviewRow
                label="Authorise deal with adviser direct"
                value={ynTri(adviserRelational.authorise_deal_with_adviser_direct)}
              />
              <ReviewRow label="Annual report send to" value={formatSendToFromJsonb(adviserRelational.annual_report_send_to)} />
              <ReviewRow label="Meeting proxy send to" value={formatSendToFromJsonb(adviserRelational.meeting_proxy_send_to)} />
              <ReviewRow
                label="Investment offers send to"
                value={formatSendToFromJsonb(adviserRelational.investment_offers_send_to)}
              />
              <ReviewRow
                label="Dividend preference"
                value={
                  adviserRelational.dividend_preference === "cash"
                    ? "Receive in cash"
                    : adviserRelational.dividend_preference === "reinvest"
                      ? "Re-invest"
                      : undefined
                }
              />
            </AdminReviewFieldGrid>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-xl border border-slate-200 pt-0 ring-0 shadow-none">
          <CardHeader className="border-b border-slate-100 bg-slate-100 px-6 py-4">
            <AdminSectionHeader
              title="Investment adviser & document preferences"
              subtitle="Structured columns empty for this application"
            />
          </CardHeader>
          <CardContent className="px-6 py-6">
            <p className="text-sm leading-relaxed text-slate-600">
              No structured adviser or document-preference data on file. If this is an older submission, those fields
              were not stored. New submissions populate{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">applications</code> adviser columns and{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">form_submission</code>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
