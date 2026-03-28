import { loadRootEnv } from "./load-root-env.js";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default("noreply@portfolioguardian.com.au"),
  APPLICATION_NOTIFICATION_EMAIL: z
    .string()
    .default("applications@portfolioguardian.com.au"),
  ADMIN_APP_URL: z.string().default("http://localhost:3000/admin"),
  /** Absolute site origin for public assets in emails (logo). Defaults to origin of ADMIN_APP_URL. */
  PUBLIC_SITE_URL: z.string().optional(),
});

export type SubmissionEnv = z.infer<typeof envSchema>;

let cachedEnv: SubmissionEnv | null = null;

/** Parse env after loading monorepo root `.env.local` (cached per process). */
export function getEnv(): SubmissionEnv {
  if (!cachedEnv) {
    loadRootEnv();
    cachedEnv = envSchema.parse(process.env);
  }
  return cachedEnv;
}

export const env = new Proxy({} as SubmissionEnv, {
  get(_, prop) {
    return getEnv()[prop as keyof SubmissionEnv];
  },
}) as SubmissionEnv;

function isLocalhostUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return true;
  return /localhost|127\.0\.0\.1|^http:\/\/0\.0\.0\.0/i.test(t);
}

function stripTrailingSlash(u: string): string {
  return u.replace(/\/$/, "");
}

/**
 * Admin portal base URL for links in emails and server logic.
 * Reads `process.env` at call time (not only cached Zod defaults) so Vercel `VERCEL_URL` works.
 *
 * Priority:
 * 1. `ADMIN_APP_URL` when set to a non-local URL
 * 2. `https://{VERCEL_URL}/admin` on Vercel (preview/production)
 * 3. `PUBLIC_SITE_URL` / `NEXT_PUBLIC_SITE_URL` origin + `/admin` when not local
 * 4. `ADMIN_APP_URL` as-is (local dev)
 * 5. `http://localhost:3000/admin`
 */
export function resolveAdminAppUrl(): string {
  loadRootEnv();
  const explicit = process.env.ADMIN_APP_URL?.trim() ?? "";
  const vercel = process.env.VERCEL_URL?.trim();
  const publicSite =
    process.env.PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";

  if (explicit && !isLocalhostUrl(explicit)) {
    return stripTrailingSlash(explicit);
  }

  if (vercel) {
    return stripTrailingSlash(`https://${vercel}/admin`);
  }

  if (publicSite && !isLocalhostUrl(publicSite)) {
    try {
      return stripTrailingSlash(`${new URL(publicSite).origin}/admin`);
    } catch {
      /* fall through */
    }
  }

  if (explicit) {
    return stripTrailingSlash(explicit);
  }

  return "http://localhost:3000/admin";
}

export function resolvePublicSiteUrl(): string {
  const raw = process.env.PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && !isLocalhostUrl(raw)) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  try {
    return new URL(resolveAdminAppUrl()).origin;
  } catch {
    return "http://localhost:3000";
  }
}
