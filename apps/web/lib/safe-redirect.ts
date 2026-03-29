/**
 * Prevents open redirects: only same-site path redirects (single leading slash, no scheme).
 * Rejects protocol-relative URLs (`//evil.com`) and `https:`-style values.
 */
export function resolveSafeInternalPath(raw: string | null | undefined, fallback: string): string {
  const t = (raw ?? "").trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://") || t.includes("\\")) {
    return fallback;
  }
  const q = t.indexOf("?");
  const pathOnly = q === -1 ? t : t.slice(0, q);
  if (pathOnly.includes("//")) {
    return fallback;
  }
  return t;
}
