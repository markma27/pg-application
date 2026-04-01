import type { FullApplicationSubmission } from "@pg/shared";
import { env, resolveAdminAppUrl, resolvePublicSiteUrl } from "../env.js";
import { resend } from "../resend.js";
import {
  buildApplicantConfirmationEmail,
  buildApplicationNotificationEmail,
} from "./application-notification-email.js";
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
}): Promise<{
  sent: boolean;
  error: string | null;
  applicantConfirmationSent: boolean;
  applicantConfirmationError: string | null;
}> {
  const none = {
    sent: false,
    error: "Resend is not configured." as string | null,
    applicantConfirmationSent: false,
    applicantConfirmationError: "Resend is not configured." as string | null,
  };

  if (!resend) {
    console.warn("Resend is not configured. Skipping notification emails.");
    return none;
  }

  const { applicationId, reference, payload } = params;
  const subjectRef = reference?.trim() || applicationId;
  const from = formatResendFromAddress(env.RESEND_FROM);

  const staff = await (async () => {
    const to = await getNotificationRecipientEmail();
    const { html, text, attachments } = await buildApplicationNotificationEmail({
      applicationId,
      reference,
      adminAppUrl: resolveAdminAppUrl(),
      payload,
    });
    try {
      const { data, error } = await resend.emails.send({
        from,
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
        console.error("Resend API rejected staff notification email.", error);
        return { sent: false, error: msg };
      }
      if (data?.id) {
        console.info("Staff notification email queued.", { resendEmailId: data.id });
      }
      return { sent: true, error: null as string | null };
    } catch (error) {
      console.error("Staff notification email failed.", error);
      return {
        sent: false,
        error: error instanceof Error ? error.message : "Unknown email failure",
      };
    }
  })();

  const applicantTo = payload.email?.trim();
  const applicant = await (async () => {
    if (!applicantTo) {
      return { sent: false, error: "Applicant email is missing." };
    }
    const { html, text, attachments } = await buildApplicantConfirmationEmail({
      applicationId,
      reference,
      primaryContactName: payload.primaryContactName,
      publicSiteUrl: resolvePublicSiteUrl(),
    });
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: applicantTo,
        subject: `Your PortfolioGuardian application — ${subjectRef}`,
        html,
        text,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      if (error) {
        const msg =
          typeof error === "object" && error !== null && "message" in error
            ? String((error as { message: unknown }).message)
            : JSON.stringify(error);
        console.error("Resend API rejected applicant confirmation email.", error);
        return { sent: false, error: msg };
      }
      if (data?.id) {
        console.info("Applicant confirmation email queued.", { resendEmailId: data.id, to: applicantTo });
      }
      return { sent: true, error: null as string | null };
    } catch (error) {
      console.error("Applicant confirmation email failed.", error);
      return {
        sent: false,
        error: error instanceof Error ? error.message : "Unknown email failure",
      };
    }
  })();

  return {
    sent: staff.sent,
    error: staff.error,
    applicantConfirmationSent: applicant.sent,
    applicantConfirmationError: applicant.error,
  };
}
