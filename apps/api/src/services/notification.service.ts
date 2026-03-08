import type { ApplicationAssessment, ApplicationInput } from "@pg/shared";
import { env } from "../lib/env.js";
import { resend } from "../lib/resend.js";

export async function sendApplicationNotification(params: {
  applicationId: string;
  payload: ApplicationInput;
  assessment: ApplicationAssessment;
}) {
  if (!resend) {
    console.warn("Resend is not configured. Skipping notification email.");
    return { sent: false, error: "Resend is not configured." };
  }

  const { applicationId, payload, assessment } = params;

  try {
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: env.APPLICATION_NOTIFICATION_EMAIL,
      subject: `New PortfolioGuardian application ${applicationId}`,
      text: [
        `Application ID: ${applicationId}`,
        `Contact: ${payload.primaryContactName} <${payload.email}>`,
        `Entities submitted: ${payload.entities.length}`,
        `Overall outcome: ${assessment.overallOutcome}`,
        `Indicative pricing available: ${assessment.indicativePricingAvailable ? "Yes" : "No"}`,
        `Estimated total: ${assessment.totalEstimate ?? "Review required"}`,
        `Admin link: ${env.ADMIN_APP_URL}/applications/${applicationId}`,
      ].join("\n"),
    });

    return { sent: true, error: null };
  } catch (error) {
    console.error("Notification email failed.", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown email failure",
    };
  }
}
