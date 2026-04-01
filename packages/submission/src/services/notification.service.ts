import type { FullApplicationSubmission } from "@pg/shared";
import { env, resolveAdminAppUrl } from "../env.js";
import { resend } from "../resend.js";
import { buildApplicationNotificationEmail } from "./application-notification-email.js";
import { getNotificationRecipientEmail } from "./portal-settings.service.js";

const DISPLAY_NAME = "PortfolioGuardian";

/** Resend shows a friendly sender when using `Name <email@domain>`. */
export function formatResendFromAddress(rawFrom: string): string {
  const t = rawFrom.trim();
  if (t.includes("<") && t.includes(">")) {
    return t;
  }
  return `${DISPLAY_NAME} <${t}>`;
}

export async function sendApplicationNotification(params: {
  applicationId: string;
  /** Human-readable reference from DB (e.g. PG-100001) when persisted. */
  reference?: string | null;
  payload: FullApplicationSubmission;
}) {
  if (!resend) {
    console.warn("Resend is not configured. Skipping notification email.");
    return { sent: false, error: "Resend is not configured." };
  }

  const { applicationId, reference, payload } = params;
  const to = await getNotificationRecipientEmail();

  const { html, text, attachments } = await buildApplicationNotificationEmail({
    applicationId,
    reference,
    adminAppUrl: resolveAdminAppUrl(),
    payload,
  });

  const subjectRef = reference?.trim() || applicationId;

  try {
    const { data, error } = await resend.emails.send({
      from: formatResendFromAddress(env.RESEND_FROM),
      to,
      subject: `New PortfolioGuardian application — ${subjectRef}`,
      html,
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (error) {
      const msg =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : JSON.stringify(error);
      console.error("Resend API rejected notification email.", error);
      return { sent: false, error: msg };
    }

    if (data?.id) {
      console.info("Notification email queued.", { resendEmailId: data.id });
    }

    return { sent: true, error: null };
  } catch (error) {
    console.error("Notification email failed.", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown email failure",
    };
  }
}
