"use client";

import { createClient } from "@/lib/supabase/client";
import { createImplicitAuthClient } from "@/lib/supabase/implicit-auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function parseOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null;
  const t = raw.toLowerCase() as EmailOtpType;
  return EMAIL_OTP_TYPES.includes(t) ? t : null;
}

function stripUrlHash(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, "", `${pathname}${search}`);
}

/**
 * Must run before any `createBrowserClient` (PKCE) usage: email links often put tokens in the hash.
 * PKCE clients reject that URL during init ("Not a valid PKCE flow url").
 */
async function tryImplicitSessionThenTransfer(
  next: string,
  router: { replace: (href: string) => void },
): Promise<boolean> {
  const implicit = createImplicitAuthClient();
  const {
    data: { session },
    error,
  } = await implicit.auth.getSession();

  if (error || !session) {
    stripUrlHash();
    return false;
  }

  const main = createClient();
  const { error: setErr } = await main.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (setErr) {
    stripUrlHash();
    return false;
  }

  // Do not call implicit.auth.signOut() — that revokes refresh tokens server-side and would
  // invalidate the session we just copied into the cookie client.
  router.replace(next);
  return true;
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const finished = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const nextRaw = searchParams.get("next") ?? "/admin/update-password";
      const next = nextRaw.startsWith("/") ? nextRaw : "/admin";

      const oauthError = searchParams.get("error");
      const oauthDesc = searchParams.get("error_description");
      if (oauthError) {
        const detail = oauthDesc ?? oauthError;
        router.replace(`/admin/login?error=link&detail=${encodeURIComponent(detail)}`);
        return;
      }

      if (await tryImplicitSessionThenTransfer(next, router)) {
        finished.current = true;
        return;
      }

      const token_hash = searchParams.get("token_hash");
      const token = searchParams.get("token");
      const email = searchParams.get("email");
      const typeRaw = searchParams.get("type");
      const otpType = parseOtpType(typeRaw);

      if (otpType && token_hash) {
        const main = createClient();
        const { error } = await main.auth.verifyOtp({ type: otpType, token_hash });
        if (error) {
          router.replace("/admin/login?error=auth");
          return;
        }
        finished.current = true;
        router.replace(next);
        return;
      }

      if (otpType && token && email) {
        const main = createClient();
        const { error } = await main.auth.verifyOtp({
          type: otpType,
          token,
          email,
        });
        if (error) {
          router.replace("/admin/login?error=auth");
          return;
        }
        finished.current = true;
        router.replace(next);
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const main = createClient();
        const { error } = await main.auth.exchangeCodeForSession(code);
        if (!error) {
          finished.current = true;
          router.replace(next);
          return;
        }
      }

      const main = createClient();
      const {
        data: { session: existing },
      } = await main.auth.getSession();
      if (existing) {
        finished.current = true;
        router.replace(next);
        return;
      }

      const {
        data: { subscription },
      } = main.auth.onAuthStateChange((_event, session) => {
        if (session && !finished.current) {
          finished.current = true;
          subscription.unsubscribe();
          router.replace(next);
        }
      });

      for (let i = 0; i < 8; i++) {
        if (finished.current) break;
        await new Promise((r) => setTimeout(r, 300));
        const {
          data: { session },
        } = await main.auth.getSession();
        if (session) {
          finished.current = true;
          subscription.unsubscribe();
          router.replace(next);
          return;
        }
      }

      subscription.unsubscribe();
      if (!finished.current) {
        router.replace("/admin/login?error=auth");
      }
    };

    void run();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[#f4f6f9] p-8 text-center text-slate-600">
      <p className="text-sm font-medium text-[#0c2742]">Completing sign-in…</p>
      <p className="text-xs text-slate-500">If nothing happens, open the link again or contact an administrator.</p>
    </div>
  );
}
