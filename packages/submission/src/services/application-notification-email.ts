import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { APPLICANT_ROLE_ADVISER_REPRESENTATIVE, type FullApplicationSubmission } from "@pg/shared";
import type { Attachment } from "resend";

/** Emerald CTA aligned with apply form / admin accents */
const CTA_GREEN = "#059669";
const CTA_GREEN_HOVER_BORDER = "#047857";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function optionalLine(label: string, value: string | undefined | null): string {
  const v = value?.trim();
  if (!v) return "";
  return `<tr><td style="padding:4px 0;font-size:14px;color:#334155;"><strong style="color:#0c2742;">${escapeHtml(label)}</strong> ${escapeHtml(v)}</td></tr>`;
}

const LOGO_CID = "pg-logo";
const LOGO_PNG = "portfolioguardian-logo.png";
const LOGO_SVG = "PortfolioGuardian_OriginalLogo.svg";

type EmailLogoAsset = {
  filePath: string;
  contentType: "image/png" | "image/svg+xml";
  attachmentFilename: string;
};

/** Same rules as `apps/web/lib/email/logo-inline.ts` (Vercel cwd often `apps/web`). */
function findPublicFile(filename: string): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 16; i++) {
    const inPublic = path.join(dir, "public", filename);
    if (existsSync(inPublic)) return inPublic;
    const inAppsWeb = path.join(dir, "apps", "web", "public", filename);
    if (existsSync(inAppsWeb)) return inAppsWeb;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function resolveEmailLogoAsset(): EmailLogoAsset | null {
  const pngPath = findPublicFile(LOGO_PNG);
  if (pngPath) {
    return { filePath: pngPath, contentType: "image/png", attachmentFilename: "logo.png" };
  }
  const svgPath = findPublicFile(LOGO_SVG);
  if (svgPath) {
    return { filePath: svgPath, contentType: "image/svg+xml", attachmentFilename: "logo.svg" };
  }
  return null;
}

function logoTextFallback(): { attachments: Attachment[]; imgHtml: string } {
  return {
    attachments: [],
    imgHtml: `<p style="margin:0;font-size:20px;font-weight:700;color:#0c2742;letter-spacing:-0.02em;">PortfolioGuardian</p>`,
  };
}

/**
 * Inline logo via CID. Prefers `portfolioguardian-logo.png`, then SVG; no `sharp`.
 */
async function buildLogoAttachmentAndImgTag(): Promise<{ attachments: Attachment[]; imgHtml: string }> {
  const asset = resolveEmailLogoAsset();
  if (!asset) {
    console.warn(
      "Email logo: no PNG or SVG found (checked cwd/public and parents apps/web/public).",
    );
    return logoTextFallback();
  }

  let buf: Buffer;
  try {
    buf = readFileSync(asset.filePath);
  } catch (err) {
    console.warn("Email logo: could not read logo file.", err);
    return logoTextFallback();
  }

  return {
    attachments: [
      {
        filename: asset.attachmentFilename,
        content: buf.toString("base64"),
        contentType: asset.contentType,
        contentId: LOGO_CID,
      },
    ],
    imgHtml: `<img src="cid:${LOGO_CID}" alt="PortfolioGuardian" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;" />`,
  };
}

/**
 * Branded HTML + plain text for Resend (logo as inline PNG or SVG CID attachment).
 */
export async function buildApplicationNotificationEmail(params: {
  applicationId: string;
  reference: string | null | undefined;
  adminAppUrl: string;
  payload: FullApplicationSubmission;
}): Promise<{ html: string; text: string; attachments: Attachment[] }> {
  const { applicationId, reference, adminAppUrl, payload } = params;

  const refLine = reference?.trim();
  const portalUrl = `${adminAppUrl.replace(/\/$/, "")}/applications/${applicationId}`;

  const { attachments, imgHtml } = await buildLogoAttachmentAndImgTag();

  const repAuthorityConfirmed =
    payload.applicantRole === APPLICANT_ROLE_ADVISER_REPRESENTATIVE && payload.representativeAuthorityConfirmed === true;

  const contactRows = [
    optionalLine("Name:", payload.primaryContactName),
    optionalLine("Email:", payload.email),
    optionalLine("Phone:", payload.phone),
    optionalLine("Postal address:", payload.postalAddress),
    optionalLine("Applicant role:", payload.applicantRole),
    optionalLine(
      "Authority to submit on behalf of client:",
      repAuthorityConfirmed ? "Confirmed" : undefined,
    ),
    optionalLine("Group / account name:", payload.groupName),
    optionalLine("Adviser details:", payload.adviserDetails),
  ].join("");

  const referenceBlock = refLine
    ? `<p style="margin:12px 0 0 0;font-size:14px;color:#475569;line-height:1.5;text-align:center;"><strong>Reference:</strong> ${escapeHtml(refLine)}</p>`
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
              <h1 style="margin:0;font-size:20px;color:#0c2742;">New application submitted</h1>
              ${referenceBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 4px 28px;">
              <h2 style="margin:0 0 8px 0;font-size:15px;color:#1e4a7a;">Primary contact</h2>
              <table role="presentation" width="100%" cellspacing="0">${contactRows}</table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 28px 28px 28px;text-align:center;">
              <a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:${CTA_GREEN};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;border:1px solid ${CTA_GREEN_HOVER_BORDER};">
                Open in Admin Portal
              </a>
              <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;word-break:break-all;text-align:center;">
                If the button does not work, copy this link:<br/>${escapeHtml(portalUrl)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const textLines = [
    `New PortfolioGuardian Application`,
    refLine ? `Reference: ${refLine}` : null,
    "",
    "Primary contact",
    `Name: ${payload.primaryContactName}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    payload.postalAddress?.trim() ? `Postal address: ${payload.postalAddress.trim()}` : null,
    `Applicant role: ${payload.applicantRole}`,
    repAuthorityConfirmed ? "Authority to submit on behalf of client: Confirmed" : null,
    payload.groupName?.trim() ? `Group / account name: ${payload.groupName}` : null,
    payload.adviserDetails?.trim() ? `Adviser details: ${payload.adviserDetails}` : null,
    "",
    `Admin Portal: ${portalUrl}`,
  ]
    .filter((x): x is string => x != null && x !== "")
    .join("\n");

  return { html, text: textLines, attachments };
}

function referenceDisplayForEmail(reference: string | null | undefined, applicationId: string): string {
  const r = reference?.trim();
  if (r) return r;
  const hex = applicationId.replace(/-/g, "").slice(-8);
  const num = Number.parseInt(hex, 16) % 1_000_000;
  const suffix = String(num).padStart(6, "0");
  return `PG-${suffix}`;
}

/**
 * Thank-you email for the applicant — matches confirmation page messaging; same branded layout as staff notification.
 */
export async function buildApplicantConfirmationEmail(params: {
  applicationId: string;
  reference: string | null | undefined;
  primaryContactName: string;
  publicSiteUrl: string;
}): Promise<{ html: string; text: string; attachments: Attachment[] }> {
  const { applicationId, reference, primaryContactName, publicSiteUrl } = params;
  const refDisplay = referenceDisplayForEmail(reference, applicationId);
  const site = publicSiteUrl.replace(/\/$/, "");
  const mailtoHelp = `mailto:applications@portfolioguardian.com.au?subject=${encodeURIComponent(`Application inquiry - Reference ${refDisplay}`)}`;

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
              <h1 style="margin:0;font-size:22px;color:#059669;">Application submitted</h1>
              <p style="margin:10px 0 0 0;font-size:14px;color:#475569;line-height:1.5;">
                Thank you for choosing PortfolioGuardian for your investment portfolio administration needs.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 8px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #a7f3d0;background:#ecfdf5;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;text-align:center;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:#065f46;">Reference number</p>
                    <p style="margin:8px 0 0 0;font-size:24px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-weight:700;color:#047857;">${escapeHtml(refDisplay)}</p>
                    <p style="margin:10px 0 0 0;font-size:12px;color:#64748b;">Please save this reference number for your records.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 4px 28px;">
              <h2 style="margin:0 0 10px 0;font-size:16px;color:#0c2742;">What happens next?</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;color:#334155;line-height:1.55;">
                <tr>
                  <td style="padding:8px 0 0 0;vertical-align:top;width:28px;">
                    <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:9999px;background:#059669;color:#ffffff;font-size:12px;font-weight:700;">1</span>
                  </td>
                  <td style="padding:8px 0 0 8px;">
                    <strong style="color:#0f172a;">Application review</strong><br/>
                    <span style="color:#475569;">Our PortfolioGuardian team will review your application within 2–3 business days.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0 0 0;vertical-align:top;width:28px;">
                    <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:9999px;background:#059669;color:#ffffff;font-size:12px;font-weight:700;">2</span>
                  </td>
                  <td style="padding:14px 0 0 8px;">
                    <strong style="color:#0f172a;">Team contact</strong><br/>
                    <span style="color:#475569;">We will reach out if we need any further information.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0 0 0;vertical-align:top;width:28px;">
                    <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:9999px;background:#059669;color:#ffffff;font-size:12px;font-weight:700;">3</span>
                  </td>
                  <td style="padding:14px 0 0 8px;">
                    <strong style="color:#0f172a;">Next steps</strong><br/>
                    <span style="color:#475569;">We will provide a proposal and advise you of the next steps.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 40px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:12px;background:linear-gradient(to bottom right,#f8fafc,#f1f5f9);">
                <tr>
                  <td style="padding:18px 20px;text-align:center;">
                    <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">Need help?</p>
                    <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Questions about your application? Contact our team:</p>
                    <p style="margin:12px 0 0 0;font-size:14px;">
                      <a href="mailto:applications@portfolioguardian.com.au" style="color:#059669;font-weight:600;text-decoration:none;">applications@portfolioguardian.com.au</a>
                    </p>
                    <p style="margin:6px 0 0 0;font-size:14px;">
                      <a href="tel:+611300722942" style="color:#059669;font-weight:600;text-decoration:none;">1300 722 942</a>
                    </p>
                    <p style="margin:14px 0 0 0;">
                      <a href="${escapeHtml(mailtoHelp)}" style="display:inline-block;background:#94a3b8;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;">Email about this application</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const name = primaryContactName.trim() || "there";
  const text = [
    "PortfolioGuardian - Application submitted",
    "",
    `Hello ${name},`,
    "",
    "Thank you for choosing PortfolioGuardian for your investment portfolio administration needs.",
    "",
    `Reference number: ${refDisplay}`,
    "Please save this reference number for your records.",
    "",
    "What happens next?",
    "1. Application review — Our PortfolioGuardian team will review your application within 2–3 business days.",
    "2. Team contact — We will reach out if we need any further information.",
    "3. Next steps — We will provide a proposal and advise you of the next steps.",
    "",
    "Need help?",
    "Email: applications@portfolioguardian.com.au",
    "Phone: 1300 722 942",
    "",
  ].join("\n");

  return { html, text, attachments };
}
