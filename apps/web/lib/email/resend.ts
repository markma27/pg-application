import { Resend } from "resend";
import { buildApplicationAssigneeNotificationEmail } from "@/lib/email/assignment-notification-content";
import { buildBrandedAuthEmailHtml } from "@/lib/email/branded-auth-html";
import { getSiteOrigin } from "@/lib/site-url";

const RESEND_DISPLAY_NAME = "PortfolioGuardian";

/** Resend shows a friendly sender when using `Name <email@domain>`. */
function formatResendFromAddress(rawFrom: string): string {
  const t = rawFrom.trim();
  if (!t) {
    return `${RESEND_DISPLAY_NAME} <onboarding@resend.dev>`;
  }
  if (t.includes("<") && t.includes(">")) {
    return t;
  }
  return `${RESEND_DISPLAY_NAME} <${t}>`;
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return formatResendFromAddress(process.env.RESEND_FROM?.trim() || "onboarding@resend.dev");
}

export async function sendPasswordResetEmail(to: string, actionLink: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }
  const origin = getSiteOrigin();
  const { html, attachments } = await buildBrandedAuthEmailHtml({
    title: "Reset your admin password",
    paragraphs: [
      "We received a request to reset the password for your PortfolioGuardian admin portal account.",
      "Use the button below to choose a new password. If you did not request this, you can ignore this email.",
    ],
    ctaLabel: "Set a new password",
    ctaUrl: actionLink,
    footnote: `Sent from ${origin}`,
  });

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject: "Reset your PortfolioGuardian admin password",
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
    text: [
      "We received a request to reset the password for your PortfolioGuardian admin portal account.",
      "",
      `Set a new password: ${actionLink}`,
      "",
      `If you did not request this, ignore this email. ${origin}`,
    ].join("\n"),
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendUserInvitationEmail(
  to: string,
  fullName: string,
  actionLink: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }
  const origin = getSiteOrigin();
  const greeting = fullName.trim() ? `Hello ${fullName.trim()},` : "Hello,";
  const { html, attachments } = await buildBrandedAuthEmailHtml({
    title: "You’re invited to the admin portal",
    paragraphs: [
      greeting,
      "You have been invited to access the PortfolioGuardian client application admin portal.",
      "Use the button below to accept the invitation and set your password. If the link stops working, ask an administrator to send a new invitation.",
    ],
    ctaLabel: "Accept invitation & set password",
    ctaUrl: actionLink,
    footnote: `Sent from ${origin}`,
  });

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject: "You’re invited to the PortfolioGuardian admin portal",
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
    text: [
      greeting,
      "You have been invited to the PortfolioGuardian admin portal.",
      "",
      `Accept invitation: ${actionLink}`,
      "",
      origin,
    ].join("\n"),
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendApplicationAssigneeNotificationEmail(
  to: string,
  params: {
    assigneeName: string;
    reference: string;
    primaryContactName: string;
    applicationId: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }
  const origin = getSiteOrigin().replace(/\/$/, "");
  const applicationDetailUrl = `${origin}/admin/applications/${params.applicationId}`;

  const { html, text, attachments } = await buildApplicationAssigneeNotificationEmail({
    assigneeName: params.assigneeName,
    reference: params.reference,
    primaryContactName: params.primaryContactName,
    applicationDetailUrl,
  });

  const ref = params.reference.trim() || params.applicationId.slice(0, 8);
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject: `Assigned to you: ${ref} — PortfolioGuardian admin`,
    html,
    text,
    attachments: attachments.length > 0 ? attachments : undefined,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
