import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Attachment } from "resend";
import sharp from "sharp";

/** CID used across Resend HTML emails for inline PNG logo. */
export const EMAIL_LOGO_CID = "pg-logo";

const LOGO_SVG = "PortfolioGuardian_OriginalLogo.svg";

/**
 * Resolve `public/PortfolioGuardian_OriginalLogo.svg` for both layouts:
 * - Vercel root = `apps/web` → `cwd/public/...`
 * - Monorepo root → `cwd/apps/web/public/...` while walking parents
 */
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

function textFallback(): { attachments: Attachment[]; imgHtml: string } {
  return {
    attachments: [],
    imgHtml: `<p style="margin:0;font-size:20px;font-weight:700;color:#0c2742;letter-spacing:-0.02em;">PortfolioGuardian</p>`,
  };
}

/**
 * Gmail blocks many remote URLs; inline image via CID attachment.
 * Resend's JSON API expects attachment `content` as a base64 string (Buffer serializes wrongly).
 */
export async function buildLogoAttachmentAndImgTag(): Promise<{ attachments: Attachment[]; imgHtml: string }> {
  const svgPath = findLogoSvgPath();
  if (!svgPath) {
    console.warn("Email logo: SVG not found (checked cwd/public and parents apps/web/public).");
    return textFallback();
  }

  let svgBuf: Buffer;
  try {
    svgBuf = readFileSync(svgPath);
  } catch (err) {
    console.warn("Email logo: could not read SVG file.", err);
    return textFallback();
  }

  try {
    const pngBuf = await sharp(svgBuf).resize(440, null, { fit: "inside" }).png().toBuffer();
    return {
      attachments: [
        {
          filename: "logo.png",
          content: pngBuf.toString("base64"),
          contentType: "image/png",
          contentId: EMAIL_LOGO_CID,
        },
      ],
      imgHtml: `<img src="cid:${EMAIL_LOGO_CID}" alt="PortfolioGuardian" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;" />`,
    };
  } catch (err) {
    console.warn("Email logo: sharp rasterize failed; trying inline SVG attachment.", err);
    return {
      attachments: [
        {
          filename: "logo.svg",
          content: svgBuf.toString("base64"),
          contentType: "image/svg+xml",
          contentId: EMAIL_LOGO_CID,
        },
      ],
      imgHtml: `<img src="cid:${EMAIL_LOGO_CID}" alt="PortfolioGuardian" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;" />`,
    };
  }
}
