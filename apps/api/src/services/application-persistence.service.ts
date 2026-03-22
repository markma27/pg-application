import type {
  ApplicationAssessment,
  ApplicationInput,
  FullApplicationSubmission,
} from "../../../../packages/shared/src/index.js";
import { supabaseAdmin } from "../lib/supabase.js";

function serviceLabel(code: string): string {
  return code
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Persist document-routing fields as JSONB (array, "not_required", or omit when unset). */
function documentSendToJson(
  v: FullApplicationSubmission["annualReportSendTo"],
): unknown | null {
  if (v === "" || v == null) return null;
  return v;
}

function triStateBool(v: boolean | "" | undefined): boolean | null {
  if (v === true) return true;
  if (v === false) return false;
  return null;
}

export async function persistApplicationToSupabase(params: {
  applicationId: string;
  payload: FullApplicationSubmission;
  assessment: ApplicationAssessment;
}): Promise<{ reference: string | null }> {
  if (!supabaseAdmin) {
    return { reference: null };
  }

  const { applicationId, payload, assessment } = params;

  const core: ApplicationInput = {
    primaryContactName: payload.primaryContactName,
    email: payload.email,
    phone: payload.phone,
    applicantRole: payload.applicantRole,
    adviserDetails: payload.adviserDetails,
    groupName: payload.groupName,
    servicesComments: payload.servicesComments,
    entities: payload.entities,
  };

  const { data: appRow, error: appError } = await supabaseAdmin
    .from("applications")
    .insert({
      id: applicationId,
      primary_contact_name: payload.primaryContactName,
      email: payload.email,
      phone: payload.phone,
      applicant_role: payload.applicantRole,
      adviser_details: payload.adviserDetails,
      group_name: payload.groupName,
      services_comments: payload.servicesComments,
      status: "pending",
      overall_outcome: assessment.overallOutcome,
      form_submission: payload as unknown as Record<string, unknown>,
      adviser_name: payload.adviserName?.trim() || null,
      adviser_company: payload.adviserCompany?.trim() || null,
      adviser_address: payload.adviserAddress?.trim() || null,
      adviser_tel: payload.adviserTel?.trim() || null,
      adviser_fax: payload.adviserFax?.trim() || null,
      adviser_email: payload.adviserEmail?.trim() || null,
      nominate_adviser_primary_contact: triStateBool(payload.nominateAdviserPrimaryContact),
      authorise_adviser_access_statements: triStateBool(payload.authoriseAdviserAccessStatements),
      authorise_deal_with_adviser_direct: triStateBool(payload.authoriseDealWithAdviserDirect),
      annual_report_send_to: documentSendToJson(payload.annualReportSendTo),
      meeting_proxy_send_to: documentSendToJson(payload.meetingProxySendTo),
      investment_offers_send_to: documentSendToJson(payload.investmentOffersSendTo),
      dividend_preference:
        payload.dividendPreference === "cash" || payload.dividendPreference === "reinvest"
          ? payload.dividendPreference
          : null,
    })
    .select("reference")
    .single();

  if (appError || !appRow) {
    console.error("Supabase applications insert failed.", appError);
    throw new Error(appError?.message ?? "Failed to save application.");
  }

  const reference = appRow.reference as string;

  const containsJmEntities = assessment.entityAssessments.some((e) => e.routingOutcome === "jm_fit");

  const { error: pricingError } = await supabaseAdmin.from("application_pricing_summary").insert({
    application_id: applicationId,
    pg_annual_subtotal: assessment.annualSubtotal,
    pg_onboarding_subtotal: assessment.onboardingSubtotal,
    group_discount_amount: assessment.groupDiscountAmount,
    pg_total_estimate: assessment.totalEstimate,
    contains_jm_entities: containsJmEntities,
    manual_review_required: assessment.requiresManualReview,
  });

  if (pricingError) {
    console.error("Supabase pricing summary insert failed.", pricingError);
    throw new Error(pricingError.message);
  }

  const individualRows = payload.individuals.map((ind, sortOrder) => ({
    application_id: applicationId,
    sort_order: sortOrder,
    form_individual_id: ind.id,
    relationship_roles: ind.relationshipRoles,
    title: ind.title,
    full_name: ind.fullName,
    street_address: ind.streetAddress,
    street_address_line2: ind.streetAddressLine2?.trim() || null,
    tax_file_number: ind.taxFileNumber,
    date_of_birth: ind.dateOfBirth,
    country_of_birth: ind.countryOfBirth,
    city: ind.city,
    occupation: ind.occupation,
    employer: ind.employer,
    email: ind.email,
  }));

  if (individualRows.length > 0) {
    const { error: indError } = await supabaseAdmin.from("application_individuals").insert(individualRows);
    if (indError) {
      console.error("Supabase application_individuals insert failed.", indError);
      throw new Error(indError.message);
    }
  }

  for (const entity of core.entities) {
    const ea = assessment.entityAssessments.find((x) => x.entityId === entity.id);
    if (!ea) {
      throw new Error(`Missing assessment for entity ${entity.id}`);
    }

    const { data: entRow, error: entError } = await supabaseAdmin
      .from("application_entities")
      .insert({
        application_id: applicationId,
        entity_name: entity.entityName,
        entity_type: entity.entityType,
        portfolio_status: entity.portfolioStatus,
        portfolio_hin: entity.portfolioHin || null,
        abn: entity.abn || null,
        tfn: entity.tfn || null,
        registered_for_gst:
          entity.registeredForGst === true ? true : entity.registeredForGst === false ? false : null,
        listed_investment_count: entity.listedInvestmentCount,
        unlisted_investment_count: entity.unlistedInvestmentCount,
        property_count: entity.propertyCount,
        wrap_count: entity.wrapCount,
        other_assets_text: entity.otherAssetsText || null,
        has_crypto: entity.hasCrypto,
        has_foreign_investments: entity.hasForeignInvestments,
        service_start_date: entity.commencementDate,
        routing_outcome: ea.routingOutcome,
        complexity_points: ea.complexityPoints,
        indicative_annual_fee: ea.annualFeeEstimate,
        indicative_onboarding_fee: ea.onboardingFeeEstimate,
        pricing_status: ea.pricingStatus,
      })
      .select("id")
      .single();

    if (entError || !entRow) {
      console.error("Supabase entity insert failed.", entError);
      throw new Error(entError?.message ?? "Failed to save entity.");
    }

    const entityId = entRow.id as string;
    const services = entity.serviceCodes.map((code) => ({
      entity_id: entityId,
      service_code: code,
      service_label: serviceLabel(code),
    }));

    if (services.length > 0) {
      const { error: svcError } = await supabaseAdmin.from("entity_services").insert(services);
      if (svcError) {
        console.error("Supabase entity_services insert failed.", svcError);
        throw new Error(svcError.message);
      }
    }
  }

  const applicantLabel = `${payload.primaryContactName.trim()} (${payload.email.trim()})`;
  const { error: auditErr } = await supabaseAdmin.from("application_audit_events").insert({
    application_id: applicationId,
    event_type: "form_submitted",
    actor_type: "applicant",
    actor_label: applicantLabel,
    detail: { source: "public_application_form" },
  });
  if (auditErr) {
    console.warn("Could not record application_audit_events row.", auditErr);
  }

  return { reference };
}

export async function markNotificationPersisted(params: {
  applicationId: string;
  sent: boolean;
  error: string | null;
}): Promise<void> {
  if (!supabaseAdmin) return;

  const { applicationId, sent, error } = params;
  const { error: upError } = await supabaseAdmin
    .from("applications")
    .update({
      notification_email_sent: sent,
      notification_email_sent_at: sent ? new Date().toISOString() : null,
      notification_email_error: error,
    })
    .eq("id", applicationId);

  if (upError) {
    console.warn("Could not update notification flags on application.", upError);
  }
}
