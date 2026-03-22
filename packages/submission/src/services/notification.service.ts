import type { ApplicationAssessment, ApplicationInput } from "@pg/shared";
import { env } from "../env.js";
import { resend } from "../resend.js";

export async function sendApplicationNotification(params: {
  applicationId: string;
  /** Human-readable reference from DB (e.g. PG-100001) when persisted. */
  reference?: string | null;
  payload: ApplicationInput;
  assessment: ApplicationAssessment;
}) {
  if (!resend) {
    console.warn("Resend is not configured. Skipping notification email.");
    return { sent: false, error: "Resend is not configured." };
  }

  const { applicationId, reference, payload, assessment } = params;
  const refLine = reference ? `Reference: ${reference}` : `Application ID: ${applicationId}`;

  try {
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: env.APPLICATION_NOTIFICATION_EMAIL,
      subject: `New PortfolioGuardian application ${reference ?? applicationId}`,
      text: [
        refLine,
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
