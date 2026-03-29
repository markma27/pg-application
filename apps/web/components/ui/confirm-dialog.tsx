"use client";

import { Button } from "@/components/ui/button";
import { PortalModal } from "@/components/ui/portal-modal";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  loading,
  loadingConfirmLabel,
  error,
  confirmVariant = "default",
  titleId = "confirm-dialog-title",
  descriptionId = "confirm-dialog-description",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  /** Shown on the confirm button while `loading` (e.g. "Deleting…"). */
  loadingConfirmLabel?: string;
  error?: string | null;
  confirmVariant?: "default" | "destructive";
  titleId?: string;
  descriptionId?: string;
}) {
  return (
    <PortalModal
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <h2 id={titleId} className="text-lg font-semibold text-[#0c2742]">
        {title}
      </h2>
      <div id={descriptionId} className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </div>
      {error ? (
        <p
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={loading} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={cn(
            confirmVariant === "destructive"
              ? "border-0 bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
              : "border-0 bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
          )}
        >
          {loading ? (loadingConfirmLabel ?? `${confirmLabel}…`) : confirmLabel}
        </Button>
      </div>
    </PortalModal>
  );
}
