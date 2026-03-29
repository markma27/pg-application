import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ApplicationInput } from "@pg/shared";
import type { Attachment } from "resend";
import sharp from "sharp";

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
const LOGO_SVG = "PortfolioGuardian_OriginalLogo.svg";

/** Same rules as `apps/web/lib/email/logo-inline.ts` (Vercel cwd often `apps/web`). */
function findLogoSvgPath(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 16; i++) {
    const inPublic = path.join(dir, "public", LOGO_SVG);
    if (existsSync(inPublic)) return inPublic;
    const inAppsWeb = path.join(dir, "apps", "web", "public", LOGO_SVG);
    if (existsSync(inAppsWeb)) return inAppsWeb;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
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
 * Gmail blocks many remote URLs (e.g. localhost) and often blocks SVG/data URLs.
 * Inline PNG via CID attachment; Resend expects base64 `content`, not a Buffer JSON blob.
 */
async function buildLogoAttachmentAndImgTag(): Promise<{ attachments: Attachment[]; imgHtml: string }> {
  const svgPath = findLogoSvgPath();
  if (!svgPath) {
    console.warn("Email logo: SVG not found (checked cwd/public and parents apps/web/public).");
    return logoTextFallback();
  }

  let svgBuf: Buffer;
  try {
    svgBuf = readFileSync(svgPath);
  } catch (err) {
    console.warn("Email logo: could not read SVG file.", err);
    return logoTextFallback();
  }

  try {
    const pngBuf = await sharp(svgBuf).resize(440, null, { fit: "inside" }).png().toBuffer();
    return {
      attachments: [
        {
          filename: "logo.png",
          content: pngBuf.toString("base64"),
          contentType: "image/png",
          contentId: LOGO_CID,
        },
      ],
      imgHtml: `<img src="cid:${LOGO_CID}" alt="PortfolioGuardian" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;" />`,
    };
  } catch (err) {
    console.warn("Email logo: sharp rasterize failed; trying inline SVG attachment.", err);
    return {
      attachments: [
        {
          filename: "logo.svg",
          content: svgBuf.toString("base64"),
          contentType: "image/svg+xml",
          contentId: LOGO_CID,
        },
      ],
      imgHtml: `<img src="cid:${LOGO_CID}" alt="PortfolioGuardian" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;" />`,
    };
  }
}

/**
 * Branded HTML + plain text for Resend (logo as inline PNG attachment when possible).
 */
export async function buildApplicationNotificationEmail(params: {
  applicationId: string;
  reference: string | null | undefined;
  adminAppUrl: string;
  payload: ApplicationInput;
}): Promise<{ html: string; text: string; attachments: Attachment[] }> {
  const { applicationId, reference, adminAppUrl, payload } = params;

  const refLine = reference?.trim();
  const portalUrl = `${adminAppUrl.replace(/\/$/, "")}/applications/${applicationId}`;

  const { attachments, imgHtml } = await buildLogoAttachmentAndImgTag();

  const contactRows = [
    optionalLine("Name:", payload.primaryContactName),
    optionalLine("Email:", payload.email),
    optionalLine("Phone:", payload.phone),
    optionalLine("Applicant role:", payload.applicantRole),
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
    `Applicant role: ${payload.applicantRole}`,
    payload.groupName?.trim() ? `Group / account name: ${payload.groupName}` : null,
    payload.adviserDetails?.trim() ? `Adviser details: ${payload.adviserDetails}` : null,
    "",
    `Admin Portal: ${portalUrl}`,
  ]
    .filter((x): x is string => x != null && x !== "")
    .join("\n");

  return { html, text: textLines, attachments };
}
