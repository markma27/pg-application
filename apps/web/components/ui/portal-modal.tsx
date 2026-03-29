"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared with profile / role dialogs — border matches branded admin panels. */
export const PORTAL_MODAL_PANEL_CLASSES =
  "fixed left-1/2 top-1/2 z-[100] w-[min(100vw-2rem,28rem)] max-h-[min(90vh,100%)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[#dce6f7] bg-white p-6 shadow-xl outline-none backdrop:bg-black/40";

/**
 * Native `<dialog>` centered in the viewport with a dimmed backdrop.
 * `open` is controlled; closing via Esc, backdrop click, or `close()` calls `onClose`.
 */
export function PortalModal({
  open,
  onClose,
  children,
  className,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal();
    } else if (d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => {
      onClose();
    };
    d.addEventListener("close", onDialogClose);
    return () => d.removeEventListener("close", onDialogClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={cn(PORTAL_MODAL_PANEL_CLASSES, className)}
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </dialog>
  );
}
