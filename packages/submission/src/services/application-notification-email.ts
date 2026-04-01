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
