/**
 * Public site origin for redirects (auth callback, password recovery, invites).
 * Prefer NEXT_PUBLIC_SITE_ORIGIN; otherwise derive from ADMIN_APP_URL.
 */
export function getSiteOrigin(): string {
  const direct = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim();
  if (direct) {
    return direct.replace(/\/$/, "");
  }
  const adminUrl = process.env.ADMIN_APP_URL?.trim();
  if (adminUrl) {
    try {
      return new URL(adminUrl).origin;
    } catch {
      /* fall through */
    }
  }
  return "http://localhost:3000";
}
