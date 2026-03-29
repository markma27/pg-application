import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Attachment } from "resend";

/** CID used across Resend HTML emails for inline logo (PNG preferred; avoids `sharp`). */
export const EMAIL_LOGO_CID = "pg-logo";

const LOGO_PNG = "portfolioguardian-logo.png";
const LOGO_SVG = "PortfolioGuardian_OriginalLogo.svg";

type EmailLogoAsset = {
  filePath: string;
  contentType: "image/png" | "image/svg+xml";
  attachmentFilename: string;
};

/**
 * Resolve a file under `public/` for both layouts:
 * - Vercel root = `apps/web` → `cwd/public/...`
 * - Monorepo root → `cwd/apps/web/public/...` while walking parents
 */
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

function textFallback(): { attachments: Attachment[]; imgHtml: string } {
  return {
    attachments: [],
    imgHtml: `<p style="margin:0;font-size:20px;font-weight:700;color:#0c2742;letter-spacing:-0.02em;">PortfolioGuardian</p>`,
  };
}

/**
 * Inline logo via CID attachment. Prefers `portfolioguardian-logo.png`, then SVG; no `sharp`.
 */
export async function buildLogoAttachmentAndImgTag(): Promise<{ attachments: Attachment[]; imgHtml: string }> {
  const asset = resolveEmailLogoAsset();
  if (!asset) {
    console.warn(
      "Email logo: no PNG or SVG found (checked cwd/public and parents apps/web/public).",
    );
    return textFallback();
  }

  let buf: Buffer;
  try {
    buf = readFileSync(asset.filePath);
  } catch (err) {
    console.warn("Email logo: could not read logo file.", err);
    return textFallback();
  }

  return {
    attachments: [
      {
        filename: asset.attachmentFilename,
        content: buf.toString("base64"),
        contentType: asset.contentType,
        contentId: EMAIL_LOGO_CID,
      },
    ],
    imgHtml: `<img src="cid:${EMAIL_LOGO_CID}" alt="PortfolioGuardian" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;" />`,
  };
}
