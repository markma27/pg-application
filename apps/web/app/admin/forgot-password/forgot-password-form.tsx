"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/admin/users-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-8">
      <h1 className="text-center text-xl font-bold tracking-tight text-[#0c2742]">Forgot password</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Enter your email and we will send you a link to set a new password if an account exists.
      </p>

      {state?.ok ? (
        <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          If an account exists for that address, you will receive an email with reset instructions shortly.
        </p>
      ) : null}

      {state?.error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
      ) : null}

      <form action={formAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending || state?.ok}
            className="h-11 border-slate-300 bg-white"
          />
        </div>
        <Button
          type="submit"
          disabled={pending || state?.ok}
          className="h-11 w-full rounded-lg border-0 bg-emerald-700 text-base font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/admin/login" className="font-medium text-[#1e4a7a] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
