/**
 * Public site origin for redirects (auth callback, password recovery, invites).
 *
 * Priority (aligned with `@pg/submission` `resolvePublicSiteUrl` / `resolveAdminAppUrl`):
 * 1. `NEXT_PUBLIC_SITE_ORIGIN` — explicit origin (recommended for production)
 * 2. `PUBLIC_SITE_URL` / `NEXT_PUBLIC_SITE_URL` — when not localhost
 * 3. `ADMIN_APP_URL` — origin when not localhost
 * 4. `VERCEL_URL` — `https://{VERCEL_URL}` on Vercel when the above are missing
 * 5. `ADMIN_APP_URL` as-is (e.g. localhost for local dev)
 * 6. `http://localhost:3000`
 */

function isLocalhostUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return true;
  return /localhost|127\.0\.0\.1|^http:\/\/0\.0\.0\.0/i.test(t);
}

function stripTrailingSlash(u: string): string {
  return u.replace(/\/$/, "");
}

export function getSiteOrigin(): string {
  const direct = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim();
  if (direct) {
    try {
      const withScheme = /^https?:\/\//i.test(direct) ? direct : `https://${direct}`;
      return stripTrailingSlash(new URL(withScheme).origin);
    } catch {
      return stripTrailingSlash(direct);
    }
  }

  const publicSite =
    process.env.PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  if (publicSite && !isLocalhostUrl(publicSite)) {
    try {
      return stripTrailingSlash(new URL(publicSite).origin);
    } catch {
      /* fall through */
    }
  }

  const adminUrl = process.env.ADMIN_APP_URL?.trim() ?? "";
  if (adminUrl && !isLocalhostUrl(adminUrl)) {
    try {
      return stripTrailingSlash(new URL(adminUrl).origin);
    } catch {
      /* fall through */
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return stripTrailingSlash(`https://${vercel}`);
  }

  if (adminUrl) {
    try {
      return stripTrailingSlash(new URL(adminUrl).origin);
    } catch {
      /* fall through */
    }
  }

  return "http://localhost:3000";
}
