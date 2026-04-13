import { buildApplicationPdfBytes } from "@pg/shared";
import type { FullApplicationSubmission } from "@pg/shared";

export async function downloadApplicationPdf(params: {
  payload: FullApplicationSubmission;
  /** Shown in the PDF header as “Reference: …”. */
  reference: string;
  /** Used for the downloaded filename (sanitized). */
  filenameBase: string;
}): Promise<void> {
  const safe = params.filenameBase.trim().replace(/[^\w.-]+/g, "_") || "application";
  const logoRes = await fetch("/portfolioguardian-logo.png");
  const logoPngBytes = logoRes.ok ? new Uint8Array(await logoRes.arrayBuffer()) : undefined;
  const bytes = await buildApplicationPdfBytes({
    payload: params.payload,
    reference: params.reference,
    logoPngBytes,
  });
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PortfolioGuardian-Application-${safe}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
