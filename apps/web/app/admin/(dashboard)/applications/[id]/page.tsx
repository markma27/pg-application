import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers } from "lucide-react";
import { fullApplicationSubmissionSchema, mergePricingModelWithDefaults } from "@pg/shared";
import { AdminFormSubmissionDetails } from "@/components/admin-form-submission-details";
import { parsePricingModelJson } from "@/lib/pricing-calculator/model-serialization";
import {
  AdminLegacyApplicationDetails,
  type AdviserRelationalFields,
  type IndividualDbRow,
} from "@/components/admin-legacy-application-details";
import {
  AdminApplicationAuditSection,
  type ApplicationAuditEventRow,
} from "@/components/admin-application-audit-section";
import { AdminDownloadApplicationPdfButton } from "@/components/admin-download-application-pdf-button";
import { AdminApplicationDeleteRow } from "@/components/admin-application-delete-row";
import { ApplicationStatusBadges } from "@/components/admin-application-status-badges";
import { AdminApplicationStatusFlow } from "@/components/admin-application-status-flow";
import type { PortfolioDocRow } from "@/components/admin-portfolio-documents";
import { createClient } from "@/lib/supabase/server";
import { formatPortalDateTime } from "@/lib/portal-datetime";
import { updateApplicationWorkflowStatus } from "./actions";

type EntityServiceRow = {
  id: string;
  service_code: string;
  service_label: string;
};

type EntityRow = {
  id: string;
  entity_name: string;
  entity_type: string;
  portfolio_status: string;
  portfolio_hin: string | null;
  abn: string | null;
  tfn: string | null;
  registered_for_gst: boolean | null;
  has_primary_bank_account?: boolean | null;
  primary_bank_name?: string | null;
  primary_bank_account_name?: string | null;
  primary_bank_bsb?: string | null;
  primary_bank_account_number?: string | null;
  listed_investment_count: number;
  unlisted_investment_count: number;
  property_count: number;
  wrap_count: number;
  bank_account_count?: number;
  foreign_bank_account_count?: number;
  loan_count?: number;
  cryptocurrency_count?: number;
  other_assets_text: string | null;
  has_crypto: boolean;
  has_foreign_investments: boolean;
  routing_outcome: string;
  service_start_date: string;
  complexity_points: number;
  indicative_annual_fee: string | number | null;
  indicative_onboarding_fee: string | number | null;
  pricing_status: string;
  entity_services: EntityServiceRow[] | null;
  portfolio_documents: unknown;
  form_submission_entity_id: string | null;
};

function portfolioDocsFromRow(raw: unknown): PortfolioDocRow[] {
  if (!Array.isArray(raw)) return [];
  const out: PortfolioDocRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const storage_path = o.storage_path;
    const original_name = o.original_name;
    if (typeof storage_path !== "string" || typeof original_name !== "string") continue;
    out.push({
      storage_path,
      original_name,
      content_type: typeof o.content_type === "string" ? o.content_type : undefined,
      size_bytes: typeof o.size_bytes === "number" ? o.size_bytes : undefined,
    });
  }
  return out;
}

function portfolioDocumentsByFormEntityId(rows: EntityRow[]): Record<string, PortfolioDocRow[]> {
  const map: Record<string, PortfolioDocRow[]> = {};
  for (const row of rows) {
    const fid = row.form_submission_entity_id;
    if (typeof fid === "string" && fid.trim()) {
      const docs = portfolioDocsFromRow(row.portfolio_documents);
      if (docs.length > 0) {
        map[fid] = docs;
      }
    }
  }
  return map;
}

/** Aligns with applicant email / PDF when DB reference is missing. */
function referenceDisplayForPdf(reference: string | null | undefined, applicationId: string): string {
  const r = reference?.trim();
  if (r) return r;
  const hex = applicationId.replace(/-/g, "").slice(-8);
  const num = Number.parseInt(hex, 16) % 1_000_000;
  return `PG-${String(num).padStart(6, "0")}`;
}

function outcomeLabel(outcome: string) {
  switch (outcome) {
    case "pg_fit":
      return "PG fit";
    case "jm_fit":
      return "JM referral";
    case "manual_review":
      return "Manual review";
    default:
      return outcome;
  }
}

export default async function AdminApplicationDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-950">
        Configure Supabase to view application details.
      </div>
    );
  }

  const { data: app, error: appError } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();

  if (appError || !app) {
    notFound();
  }

  const submission = fullApplicationSubmissionSchema.safeParse(app.form_submission);
  const referenceForPdf = referenceDisplayForPdf(
    typeof app.reference === "string" ? app.reference : null,
    id,
  );

  const { data: entities } = await supabase
    .from("application_entities")
    .select(
      `
      id,
      entity_name,
      entity_type,
      portfolio_status,
      portfolio_hin,
      abn,
      tfn,
      registered_for_gst,
      has_primary_bank_account,
      primary_bank_name,
      primary_bank_account_name,
      primary_bank_bsb,
      primary_bank_account_number,
      listed_investment_count,
      unlisted_investment_count,
      property_count,
      wrap_count,
      bank_account_count,
      foreign_bank_account_count,
      loan_count,
      cryptocurrency_count,
      other_assets_text,
      has_crypto,
      has_foreign_investments,
      routing_outcome,
      service_start_date,
      complexity_points,
      indicative_annual_fee,
      indicative_onboarding_fee,
      pricing_status,
      portfolio_documents,
      form_submission_entity_id,
      entity_services ( id, service_code, service_label )
    `,
    )
    .eq("application_id", id)
    .order("entity_name");

  const { data: kycRows } = await supabase
    .from("application_individuals")
    .select("*")
    .eq("application_id", id)
    .order("sort_order", { ascending: true });

  const auditQuery = await supabase
    .from("application_audit_events")
    .select("id, created_at, event_type, actor_type, actor_label, detail")
    .eq("application_id", id)
    .order("created_at", { ascending: true });

  const { data: pricingSettingsRow } = await supabase
    .from("pricing_calculator_settings")
    .select("model_json")
    .eq("id", 1)
    .maybeSingle();

  const pricingModelForAdmin =
    typeof pricingSettingsRow?.model_json === "string" && pricingSettingsRow.model_json.trim()
      ? parsePricingModelJson(pricingSettingsRow.model_json) ?? mergePricingModelWithDefaults({})
      : mergePricingModelWithDefaults({});

  const auditEvents: ApplicationAuditEventRow[] = auditQuery.error
    ? []
    : ((auditQuery.data ?? []) as ApplicationAuditEventRow[]);

  const entityRows = (entities ?? []) as unknown as EntityRow[];
  const entityPortfolioDocs = portfolioDocumentsByFormEntityId(entityRows);

  const appRel = app as typeof app & Partial<AdviserRelationalFields>;
  const adviserRelational: AdviserRelationalFields = {
    adviser_name: appRel.adviser_name ?? null,
    adviser_company: appRel.adviser_company ?? null,
    adviser_address: appRel.adviser_address ?? null,
    adviser_tel: appRel.adviser_tel ?? null,
    adviser_fax: appRel.adviser_fax ?? null,
    adviser_email: appRel.adviser_email ?? null,
    nominate_adviser_primary_contact: appRel.nominate_adviser_primary_contact ?? null,
    authorise_adviser_access_statements: appRel.authorise_adviser_access_statements ?? null,
    authorise_deal_with_adviser_direct: appRel.authorise_deal_with_adviser_direct ?? null,
    annual_report_send_to: appRel.annual_report_send_to ?? null,
    meeting_proxy_send_to: appRel.meeting_proxy_send_to ?? null,
    investment_offers_send_to: appRel.investment_offers_send_to ?? null,
    dividend_preference: appRel.dividend_preference ?? null,
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-none ring-0 sm:p-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#1e4a7a] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to applications
        </Link>
        {/* One row on lg+: application (with entities stacked below) | pipeline. Narrow left column keeps pipeline space. */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6 xl:gap-8">
          <div className="w-full min-w-0 shrink-0 lg:max-w-[min(100%,17rem)] xl:max-w-[min(100%,19rem)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-[#0c2742]">{app.reference}</h1>
              <ApplicationStatusBadges
                status={typeof app.status === "string" ? app.status : "pending"}
                deletedAt={app.deleted_at as string | null}
              />
              {submission.success ? (
                <AdminDownloadApplicationPdfButton payload={submission.data} referenceDisplay={referenceForPdf} />
              ) : null}
            </div>
            <p className="mt-1 text-base text-slate-700">{app.primary_contact_name}</p>
            {app.created_at ? (
              <p className="mt-2 text-sm text-slate-500">
                Date submitted:{" "}
                {formatPortalDateTime(app.created_at)}
              </p>
            ) : null}
            <div
              className="mt-4 flex max-w-fit min-w-[9rem] flex-col gap-0.5 rounded-lg border border-emerald-200/85 bg-gradient-to-br from-emerald-50 to-emerald-100/70 px-3 py-2.5"
              role="status"
              aria-label={`${entityRows.length} ${entityRows.length === 1 ? "entity" : "entities"} in this application`}
            >
              <div className="flex w-full items-center justify-center gap-1.5 text-emerald-800/90">
                <Layers className="h-4 w-4 shrink-0" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/85">Entities</span>
              </div>
              <p className="w-full text-center text-2xl font-bold tabular-nums leading-none text-emerald-900">{entityRows.length}</p>
              <p className="w-full text-center text-[11px] font-medium leading-tight text-emerald-800/90">
                {entityRows.length === 1 ? "portfolio entity" : "portfolio entities"}
              </p>
            </div>
          </div>
          <div className="min-w-0 flex-1 lg:border-l lg:border-slate-100 lg:pl-6 xl:pl-8">
            <AdminApplicationStatusFlow
              updateStatus={updateApplicationWorkflowStatus}
              applicationId={id}
              currentStatus={typeof app.status === "string" ? app.status : "pending"}
              disabled={!!app.deleted_at}
            />
          </div>
        </div>
      </div>

      {submission.success ? (
        <AdminFormSubmissionDetails
          data={submission.data}
          applicationId={id}
          portfolioDocumentsByEntityId={entityPortfolioDocs}
          pricingModel={pricingModelForAdmin}
        />
      ) : (
        <AdminLegacyApplicationDetails
          primaryContactName={app.primary_contact_name}
          email={app.email}
          phone={app.phone}
          postalAddress={(app as { postal_address?: string | null }).postal_address ?? null}
          applicantRole={app.applicant_role}
          groupName={app.group_name}
          adviserDetails={app.adviser_details}
          servicesComments={app.services_comments}
          entities={entityRows}
          outcomeLabel={outcomeLabel}
          kycIndividuals={(kycRows ?? []) as IndividualDbRow[]}
          adviserRelational={adviserRelational}
        />
      )}

      <AdminApplicationAuditSection
        events={auditEvents}
        legacySubmission={
          app.created_at
            ? {
                applicationId: id,
                created_at: app.created_at,
                actor_label: `${app.primary_contact_name} (${app.email})`,
              }
            : null
        }
      />

      <AdminApplicationDeleteRow
        applicationId={id}
        reference={typeof app.reference === "string" ? app.reference : id}
        deletedAt={app.deleted_at as string | null}
      />
    </div>
  );
}
