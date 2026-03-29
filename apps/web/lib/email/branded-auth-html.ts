import type { Attachment } from "resend";
import { buildLogoAttachmentAndImgTag } from "@/lib/email/logo-inline";

/**
 * Visual alignment with `packages/submission/src/services/application-notification-email.ts`
 * (background, card border, emerald CTA, logo as CID PNG, typography).
 */

export const AUTH_EMAIL_CTA_GREEN = "#059669";
export const AUTH_EMAIL_CTA_GREEN_BORDER = "#047857";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function buildBrandedAuthEmailHtml(opts: {
  title: string;
  /** Plain text lines; each becomes a paragraph. */
  paragraphs: string[];
  ctaLabel: string;
  /** Already a safe https URL from Supabase generateLink. */
  ctaUrl: string;
  /** Optional muted line under the CTA (plain text). */
  footnote?: string;
}): Promise<{ html: string; attachments: Attachment[] }> {
  const { title, paragraphs, ctaLabel, ctaUrl, footnote } = opts;
  const { attachments, imgHtml } = await buildLogoAttachmentAndImgTag();

  const bodyParagraphs = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:#334155;">${escapeHtml(p)}</p>`,
    )
    .join("");

  const foot = footnote
    ? `<p style="margin:16px 0 0 0;font-size:12px;line-height:1.45;color:#64748b;">${escapeHtml(footnote)}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #dce6f7;overflow:hidden;">
          <tr>
            <td align="center" style="padding:24px 28px 8px 28px;text-align:center;">
              ${imgHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 4px 28px;text-align:center;">
              <h1 style="margin:0;font-size:20px;color:#0c2742;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 8px 28px;">
              ${bodyParagraphs}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 28px 28px 28px;text-align:center;">
              <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${AUTH_EMAIL_CTA_GREEN};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;border:1px solid ${AUTH_EMAIL_CTA_GREEN_BORDER};">
                ${escapeHtml(ctaLabel)}
              </a>
              <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;word-break:break-all;text-align:center;">
                If the button does not work, copy this link:<br/>${escapeHtml(ctaUrl)}
              </p>
              ${foot}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { html, attachments };
}
