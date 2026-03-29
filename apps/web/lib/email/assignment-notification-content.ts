import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Attachment } from "resend";
import sharp from "sharp";
import { resolveMonorepoRoot } from "@/lib/email/repo-root";

/** Aligned with `packages/submission/.../application-notification-email.ts` */
const CTA_GREEN = "#059669";
const CTA_GREEN_HOVER_BORDER = "#047857";

const LOGO_CID = "pg-logo";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function buildLogoAttachmentAndImgTag(): Promise<{ attachments: Attachment[]; imgHtml: string }> {
  try {
    const root = resolveMonorepoRoot();
    const svgPath = path.join(root, "apps", "web", "public", "PortfolioGuardian_OriginalLogo.svg");
    if (!existsSync(svgPath)) {
      return {
        attachments: [],
        imgHtml: `<p style="margin:0;font-size:20px;font-weight:700;color:#0c2742;letter-spacing:-0.02em;">PortfolioGuardian</p>`,
      };
    }

    const svgBuf = readFileSync(svgPath);
    const pngBuf = await sharp(svgBuf).resize(440, null, { fit: "inside" }).png().toBuffer();

    return {
      attachments: [
        {
          filename: "logo.png",
          content: pngBuf,
          contentType: "image/png",
          contentId: LOGO_CID,
        },
      ],
      imgHtml: `<img src="cid:${LOGO_CID}" alt="PortfolioGuardian" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;" />`,
    };
  } catch (err) {
    console.warn("Assignment email: logo inline failed; using text fallback.", err);
    return {
      attachments: [],
      imgHtml: `<p style="margin:0;font-size:20px;font-weight:700;color:#0c2742;letter-spacing:-0.02em;">PortfolioGuardian</p>`,
    };
  }
}

/**
 * Branded HTML + plain text + optional logo attachment — matches new-application notification style.
 */
export async function buildApplicationAssigneeNotificationEmail(params: {
  assigneeName: string;
  reference: string;
  primaryContactName: string;
  applicationDetailUrl: string;
}): Promise<{ html: string; text: string; attachments: Attachment[] }> {
  const { assigneeName, reference, primaryContactName, applicationDetailUrl } = params;
  const greetingFirst = assigneeName.trim().split(/\s+/)[0] || "there";
  const refLine = reference.trim();
  const refBlock = refLine
    ? `<p style="margin:12px 0 0 0;font-size:14px;color:#475569;line-height:1.5;text-align:center;"><strong>Reference:</strong> ${escapeHtml(refLine)}</p>`
    : "";

  const { attachments, imgHtml } = await buildLogoAttachmentAndImgTag();

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
              <h1 style="margin:0;font-size:20px;color:#0c2742;">You’ve been assigned an application</h1>
              ${refBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 8px 28px;">
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:#334155;">Hello ${escapeHtml(greetingFirst)},</p>
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:#334155;">You have been assigned to work on this application in the PortfolioGuardian admin portal.</p>
              <table role="presentation" width="100%" cellspacing="0">
                <tr><td style="padding:4px 0;font-size:14px;color:#334155;"><strong style="color:#0c2742;">Primary applicant:</strong> ${escapeHtml(primaryContactName.trim() || "—")}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 28px 28px 28px;text-align:center;">
              <a href="${escapeHtml(applicationDetailUrl)}" style="display:inline-block;background:${CTA_GREEN};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;border:1px solid ${CTA_GREEN_HOVER_BORDER};">
                Open in Admin Portal
              </a>
              <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;word-break:break-all;text-align:center;">
                If the button does not work, copy this link:<br/>${escapeHtml(applicationDetailUrl)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    "PortfolioGuardian — application assignment",
    refLine ? `Reference: ${refLine}` : "",
    "",
    `Hello ${greetingFirst},`,
    "",
    "You have been assigned to work on this application in the admin portal.",
    `Primary applicant: ${primaryContactName.trim() || "—"}`,
    "",
    `Open in Admin Portal: ${applicationDetailUrl}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { html, text, attachments };
}
