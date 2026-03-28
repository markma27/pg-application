import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Email invite / magic-link redirects often use the implicit OAuth fragment (access_token in the hash).
 * `createBrowserClient` from @supabase/ssr forces `flowType: "pkce"`, which makes GoTrue reject those URLs
 * ("Not a valid PKCE flow url"). This client uses implicit flow only to parse the callback URL, then you
 * should copy the session into the main SSR browser client with `setSession`.
 */
export function createImplicitAuthClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createClient(url, key, {
    auth: {
      flowType: "implicit",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });
}
