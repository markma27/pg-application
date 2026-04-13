/**
 * Masks an Australian TFN for display (e.g. PDFs, emails).
 * Only the last 3 digits are shown; all leading digits become `*`.
 * 9 digits → ******123; 8 digits → *****123.
 */
export function maskAustralianTaxFileNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9 || digits.length === 8) {
    return `${"*".repeat(digits.length - 3)}${digits.slice(-3)}`;
  }
  if (!digits) return "—";
  return "—";
}
