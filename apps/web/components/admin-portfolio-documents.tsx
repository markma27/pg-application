"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { getPortfolioDocumentSignedUrl } from "@/lib/admin/portfolio-documents-actions";

export type PortfolioDocRow = {
  storage_path: string;
  original_name: string;
  content_type?: string;
  size_bytes?: number;
};

export function AdminPortfolioDocumentsList({
  applicationId,
  entityName,
  documents,
  variant = "standalone",
}: {
  applicationId: string;
  /** Shown only in standalone variant (e.g. legacy layout). */
  entityName?: string;
  documents: PortfolioDocRow[];
  /** `embedded`: inside an entity card; `standalone`: bordered block with entity title. */
  variant?: "standalone" | "embedded";
}) {
  const [error, setError] = useState<string | null>(null);

  if (!documents.length) return null;

  const list = (
    <ul className="mt-2 space-y-2">
        {documents.map((doc) => (
          <li key={doc.storage_path} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            <span className="min-w-0 max-w-[min(100%,28rem)] truncate text-slate-700">{doc.original_name}</span>
            <button
              type="button"
              className="shrink-0 cursor-pointer text-sm font-medium text-[#1e4a7a] underline hover:text-[#163a63]"
              onClick={async () => {
                setError(null);
                const r = await getPortfolioDocumentSignedUrl(applicationId, doc.storage_path);
                if (r.url) {
                  window.open(r.url, "_blank", "noopener,noreferrer");
                } else {
                  setError(r.error ?? "Download failed.");
                }
              }}
            >
              Download
            </button>
            {doc.size_bytes != null ? (
              <span className="text-xs text-slate-500">{(doc.size_bytes / 1024).toFixed(0)} KB</span>
            ) : null}
          </li>
        ))}
    </ul>
  );

  if (variant === "embedded") {
    return (
      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portfolio documents</p>
        {list}
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      {entityName ? <p className="text-sm font-medium text-slate-800">{entityName}</p> : null}
      {list}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
