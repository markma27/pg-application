import { randomUUID } from "node:crypto";
import {
  assessApplication,
  toApplicationInput,
  type FullApplicationSubmission,
} from "@pg/shared";
import {
  markNotificationPersisted,
  persistApplicationToSupabase,
} from "./application-persistence.service.js";
import { sendApplicationNotification } from "./notification.service.js";

export async function submitApplication(payload: FullApplicationSubmission) {
  const applicationId = randomUUID();
  const core = toApplicationInput(payload);
  const assessment = assessApplication(core);

  const { reference } = await persistApplicationToSupabase({
    applicationId,
    payload,
    assessment,
  });

  const notification = await sendApplicationNotification({
    applicationId,
    reference,
    payload: core,
  });

  await markNotificationPersisted({
    applicationId,
    sent: notification.sent,
    error: notification.error,
  });

  return {
    applicationId,
    reference,
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
