"use client";

import Image from "next/image";
import { useState } from "react";
import { recordPortalLogin } from "@/lib/admin/users-actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  errorKey?: string;
  errorDetail?: string;
  infoKey?: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Your account is not authorised for this portal.",
  auth: "This sign-in link is invalid or has expired. Request a new invitation or password reset.",
  link: "The link could not be completed.",
};

const infoMessages: Record<string, string> = {
  password_set: "Your password was updated. Sign in with your new password.",
  idle_timeout: "You were signed out after 15 minutes of inactivity.",
};

export function AdminLoginForm({ errorKey, errorDetail, infoKey }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const banner = (() => {
    if (!errorKey) return null;
    const base = errorMessages[errorKey] ?? "Unable to sign in.";
    if (!errorDetail || (errorKey !== "link" && errorKey !== "auth")) return base;
    try {
      return `${base} ${decodeURIComponent(errorDetail)}`;
    } catch {
      return `${base} ${errorDetail}`;
    }
  })();

  const infoBanner = infoKey ? (infoMessages[infoKey] ?? null) : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setFormError(error.message);
        setLoading(false);
        return;
      }
      await recordPortalLogin().catch(() => {
        /* non-blocking; last_login may still sync on next visit */
      });
      // Full navigation so the browser sends the new auth cookies immediately. Client-only
      // router.push + refresh often leaves the server layout seeing a stale session until manual refresh.
      window.location.assign("/admin");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign-in failed. Check that Supabase environment variables are set.";
      setFormError(message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex justify-center">
          <div className="relative h-[5.5rem] w-[17.5rem]">
            <Image
              src="/PortfolioGuardian_OriginalLogo.svg"
              alt="PortfolioGuardian"
              fill
              className="object-contain object-center"
              priority
            />
          </div>
        </div>
        <h1 className="mt-8 text-center text-xl font-bold tracking-tight text-[#0c2742]">
          Client Application
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">Admin Portal</p>

        {infoBanner && !banner && !formError ? (
          <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {infoBanner}
          </p>
        ) : null}

        {(banner || formError) && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError ?? banner}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-slate-700">
              Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border-slate-300 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-slate-700">
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-slate-300 bg-white"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg border-0 bg-emerald-700 text-base font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            {loading ? "Signing In…" : "Sign In"}
          </Button>
          <p className="text-center text-sm">
            <a
              href="/admin/forgot-password"
              className="font-medium text-[#1e4a7a] underline-offset-4 hover:underline"
            >
              Forgot password?
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
