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

export function resolvePublicSiteUrl(): string {
  const e = getEnv();
  const raw = e.PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  try {
    return new URL(e.ADMIN_APP_URL).origin;
  } catch {
    return "http://localhost:3000";
  }
}
