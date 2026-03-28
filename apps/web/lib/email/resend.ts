import { Resend } from "resend";
import { getSiteOrigin } from "@/lib/site-url";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.RESEND_FROM?.trim() || "onboarding@resend.dev";
}

export async function sendPasswordResetEmail(to: string, actionLink: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }
  const origin = getSiteOrigin();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject: "Reset your PortfolioGuardian admin password",
    html: `
      <p>Hello,</p>
      <p>We received a request to reset the password for your admin portal account.</p>
      <p><a href="${actionLink}">Set a new password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
      <p style="color:#64748b;font-size:12px;margin-top:24px;">${origin}</p>
    `,
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
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject: "You’re invited to the PortfolioGuardian admin portal",
    html: `
      <p>Hello${fullName ? ` ${escapeHtml(fullName)}` : ""},</p>
      <p>You have been invited to access the PortfolioGuardian client application admin portal.</p>
      <p><a href="${actionLink}">Accept invitation and set your password</a></p>
      <p>This link expires after a period set by your administrator. If it stops working, ask an admin to send a new invitation.</p>
      <p style="color:#64748b;font-size:12px;margin-top:24px;">${origin}</p>
    `,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
