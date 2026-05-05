"use client";

import { useCallback, useState } from "react";
import { FileText } from "lucide-react";
import type { FullApplicationSubmission } from "@pg/shared";
import { downloadApplicationPdf } from "@/lib/application-pdf-download";
import { Button } from "@/components/ui/button";

/**
 * Builds the same PDF as the applicant confirmation email (no optional portfolio filename list).
 */
export function AdminDownloadApplicationPdfButton({
  payload,
  referenceDisplay,
}: {
  payload: FullApplicationSubmission;
  referenceDisplay: string;
}) {
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(async () => {
    setBusy(true);
    try {
      await downloadApplicationPdf({
        payload,
        reference: referenceDisplay,
        filenameBase: referenceDisplay,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, [payload, referenceDisplay]);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={busy}
      className="border-slate-200 text-[#1e4a7a] hover:bg-slate-50"
      title="Download application PDF (same document as emailed to the applicant)"
      aria-label={busy ? "Preparing PDF" : "Download application PDF"}
    >
      <FileText className="size-5 text-[#0c2742]" aria-hidden />
    </Button>
  );
}
