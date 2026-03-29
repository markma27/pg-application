import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Attachment } from "resend";
import sharp from "sharp";
import { resolveMonorepoRoot } from "@/lib/email/repo-root";

/** CID used across Resend HTML emails for inline PNG logo. */
export const EMAIL_LOGO_CID = "pg-logo";

/**
 * Gmail blocks many remote URLs; inline PNG via CID attachment matches
 * `packages/submission/src/services/application-notification-email.ts`.
 */
export async function buildLogoAttachmentAndImgTag(): Promise<{ attachments: Attachment[]; imgHtml: string }> {
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
          contentId: EMAIL_LOGO_CID,
        },
      ],
      imgHtml: `<img src="cid:${EMAIL_LOGO_CID}" alt="PortfolioGuardian" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;" />`,
    };
  } catch (err) {
    console.warn("Email inline logo (PNG/CID) failed; using text fallback.", err);
    return {
      attachments: [],
      imgHtml: `<p style="margin:0;font-size:20px;font-weight:700;color:#0c2742;letter-spacing:-0.02em;">PortfolioGuardian</p>`,
    };
  }
}
