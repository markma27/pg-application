import type { ApplicationAssessment, ApplicationInput } from "../../../../packages/shared/src/index.js";
import { supabaseAdmin } from "../lib/supabase.js";

function serviceLabel(code: string): string {
  return code
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function persistApplicationToSupabase(params: {
  applicationId: string;
  payload: ApplicationInput;
  assessment: ApplicationAssessment;
}): Promise<{ reference: string | null }> {
  if (!supabaseAdmin) {
    return { reference: null };
  }

  const { applicationId, payload, assessment } = params;

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
      status: "New",
      overall_outcome: assessment.overallOutcome,
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

  for (const entity of payload.entities) {
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
