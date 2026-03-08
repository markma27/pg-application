import { randomUUID } from "node:crypto";
import { assessApplication, type ApplicationInput } from "@pg/shared";
import { sendApplicationNotification } from "./notification.service.js";

export async function submitApplication(payload: ApplicationInput) {
  const applicationId = randomUUID();
  const assessment = assessApplication(payload);

  // Supabase persistence will be added behind this service boundary.
  const notification = await sendApplicationNotification({
    applicationId,
    payload,
    assessment,
  });

  return {
    applicationId,
    submissionSuccess: true,
    overallOutcome: assessment.overallOutcome,
    indicativePricingAvailable: assessment.indicativePricingAvailable,
    pgEstimatedTotals: assessment.totalEstimate,
    requiresJmFollowUp: assessment.requiresJmFollowUp,
    requiresManualReview: assessment.requiresManualReview,
    notification,
    entityAssessments: assessment.entityAssessments,
  };
}
