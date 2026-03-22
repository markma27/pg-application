import { randomUUID } from "node:crypto";
import {
  assessApplication,
  type ApplicationInput,
} from "../../../../packages/shared/src/index.js";
import {
  markNotificationPersisted,
  persistApplicationToSupabase,
} from "./application-persistence.service.js";
import { sendApplicationNotification } from "./notification.service.js";

export async function submitApplication(payload: ApplicationInput) {
  const applicationId = randomUUID();
  const assessment = assessApplication(payload);

  const { reference } = await persistApplicationToSupabase({
    applicationId,
    payload,
    assessment,
  });

  const notification = await sendApplicationNotification({
    applicationId,
    reference,
    payload,
    assessment,
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
