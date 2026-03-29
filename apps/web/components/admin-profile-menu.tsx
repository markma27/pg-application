"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePortalProfileName } from "@/lib/admin/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalModal } from "@/components/ui/portal-modal";

type Props = {
  fullName: string;
};

export function AdminProfileMenu({ fullName }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updatePortalProfileName, null);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
    }
  }, [state?.ok]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
      >
        Edit profile
      </button>

      <PortalModal open={open} onClose={() => setOpen(false)} aria-labelledby="profile-dialog-title">
        <h2 id="profile-dialog-title" className="text-lg font-semibold text-[#0c2742]">
          Edit profile
        </h2>
        <p className="mt-1 text-sm text-slate-600">Your email is your sign-in ID and cannot be changed here.</p>
        <form action={formAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-full-name">Display name</Label>
            <Input
              id="profile-full-name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              defaultValue={fullName}
              disabled={pending}
              className="h-11"
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-red-700">{state.error}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </PortalModal>
    </>
  );
}
