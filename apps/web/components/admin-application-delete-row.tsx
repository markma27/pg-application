"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { softDeleteApplication } from "@/app/admin/(dashboard)/applications/[id]/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AdminApplicationDeleteRow({
  applicationId,
  reference,
  deletedAt,
}: {
  applicationId: string;
  reference: string;
  deletedAt: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  if (deletedAt) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-4">
        <p className="text-sm text-slate-600">
          This application is <span className="font-semibold text-rose-800">deleted</span>. It is hidden from the
          applications list unless <strong>Show deleted</strong> is enabled on the dashboard.
        </p>
      </div>
    );
  }

  const runDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await softDeleteApplication(applicationId);
      if (!res.ok) {
        setError(res.error ?? "Could not delete.");
        return;
      }
      closeConfirm();
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-4">
      <ConfirmDialog
        open={confirmOpen}
        onClose={closeConfirm}
        title="Delete this application?"
        description={
          <>
            This cannot be undone. Application <span className="font-semibold text-slate-800">{reference}</span> will
            be marked as deleted and hidden from the main list. You can still open it from the dashboard when{" "}
            <span className="font-medium text-slate-800">Show deleted</span> is enabled.
          </>
        }
        confirmLabel="Delete application"
        loadingConfirmLabel="Deleting…"
        confirmVariant="destructive"
        onConfirm={runDelete}
        loading={isPending}
        error={error}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="destructive"
          size="lg"
          disabled={isPending}
          onClick={() => {
            setError(null);
            setConfirmOpen(true);
          }}
          className="w-full shrink-0 sm:w-auto"
        >
          <Trash2 className="size-4" data-icon="inline-start" />
          Delete application
        </Button>
        <p className="text-sm text-slate-600 sm:max-w-xl sm:text-right">
          Marks this application as deleted. It disappears from the dashboard table until an admin enables{" "}
          <span className="font-medium text-slate-800">Show deleted</span>.
        </p>
      </div>
    </div>
  );
}
