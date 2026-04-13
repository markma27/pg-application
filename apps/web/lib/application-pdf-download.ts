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
  const fetchBytes = async (url: string): Promise<Uint8Array | undefined> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return undefined;
      return new Uint8Array(await res.arrayBuffer());
    } catch {
      return undefined;
    }
  };
  const [logoPngBytes, montserratRegularBytes, montserratBoldBytes] = await Promise.all([
    fetchBytes("/portfolioguardian-logo.png"),
    fetchBytes("/fonts/Montserrat-Regular.ttf"),
    fetchBytes("/fonts/Montserrat-Bold.ttf"),
  ]);
  const bytes = await buildApplicationPdfBytes({
    payload: params.payload,
    reference: params.reference,
    logoPngBytes,
    montserratRegularBytes,
    montserratBoldBytes,
  });
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PortfolioGuardian-Application-${safe}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
