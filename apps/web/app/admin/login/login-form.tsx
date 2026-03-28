"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  errorKey?: string;
  errorDetail?: string;
};

const errorMessages: Record<string, string> = {
  unauthorized: "Your account is not authorised for this portal.",
  auth: "This sign-in link is invalid or has expired. Request a new invitation or password reset.",
  link: "The link could not be completed.",
};

export function AdminLoginForm({ errorKey, errorDetail }: Props) {
  const router = useRouter();
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setFormError(error.message);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign-in failed. Check that Supabase environment variables are set.";
      setFormError(message);
    } finally {
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
            {loading ? "Signing in…" : "Sign In"}
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
