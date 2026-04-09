/** Australian Central Time (Adelaide) — portal UI timestamps use this IANA zone. */
export const PORTAL_TIMEZONE = "Australia/Adelaide";

const PORTAL_LOCALE = "en-AU";

/**
 * UTC instant for midnight at the start of the calendar day containing `ref` in {@link PORTAL_TIMEZONE}.
 * Used for server queries (e.g. “today’s applications”) so counts match Adelaide business days.
 */
export function startOfPortalDayIso(ref: Date = new Date()): string {
  const target = ref.toLocaleDateString("en-CA", { timeZone: PORTAL_TIMEZONE });

  let lo = ref.getTime() - 48 * 3600000;
  let hi = ref.getTime() + 48 * 3600000;

  let guard = 0;
  while (new Date(lo).toLocaleDateString("en-CA", { timeZone: PORTAL_TIMEZONE }) >= target && guard++ < 14) {
    lo -= 24 * 3600000;
  }
  guard = 0;
  while (new Date(hi).toLocaleDateString("en-CA", { timeZone: PORTAL_TIMEZONE }) < target && guard++ < 14) {
    hi += 24 * 3600000;
  }

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const day = new Date(mid).toLocaleDateString("en-CA", { timeZone: PORTAL_TIMEZONE });
    if (day < target) lo = mid + 1;
    else hi = mid;
  }

  return new Date(lo).toISOString();
}

/** Medium date + short time in Adelaide (audit, application detail, global audit log). */
export function formatPortalDateTime(iso: string): string {
  return new Date(iso).toLocaleString(PORTAL_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: PORTAL_TIMEZONE,
  });
}

/** Calendar date only in Adelaide (e.g. portal user “added”). */
export function formatPortalDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString(PORTAL_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: PORTAL_TIMEZONE,
  });
}

/** Date + time, 12-hour clock in Adelaide (e.g. last login). */
export function formatPortalDateTime12h(iso: string): string {
  return new Date(iso).toLocaleString(PORTAL_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PORTAL_TIMEZONE,
    hour12: true,
  });
}

/** `DD/MM/YYYY HH:mm` in Adelaide (applications table). */
export function formatPortalCreatedCompact(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat(PORTAL_LOCALE, {
    timeZone: PORTAL_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const pick = (type: Intl.DateTimeFormatPart["type"]) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("day")}/${pick("month")}/${pick("year")} ${pick("hour")}:${pick("minute")}`;
}
