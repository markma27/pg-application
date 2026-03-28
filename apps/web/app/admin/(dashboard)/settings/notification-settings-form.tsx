"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateNotificationRecipientEmail } from "./actions";

type Props = {
  initialEmail: string | null;
  envFallbackHint: string;
};

export function NotificationSettingsForm({ initialEmail, envFallbackHint }: Props) {
  const [state, formAction, isPending] = useActionState(updateNotificationRecipientEmail, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notification_recipient_email">Notification recipient email</Label>
        <Input
          id="notification_recipient_email"
          name="notification_recipient_email"
          type="email"
          autoComplete="email"
          placeholder="ops@yourcompany.com"
          defaultValue={initialEmail ?? ""}
          className="max-w-md"
        />
        <p className="text-xs text-slate-500">
          When a new client application is submitted, Resend sends an email to this address. Leave empty to use the
          server default ({envFallbackHint}).
        </p>
      </div>

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Settings saved.
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="bg-[#1e4a7a] hover:bg-[#163a63]">
        {isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
