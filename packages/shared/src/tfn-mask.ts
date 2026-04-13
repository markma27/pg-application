/**
 * Masks an Australian TFN for display (e.g. PDFs, emails).
 * 9 digits: first 3 + *** + last 3 (e.g. 123***234).
 * 8 digits: first 2 + *** + last 3.
 */
export function maskAustralianTaxFileNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}***${digits.slice(6)}`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}***${digits.slice(5)}`;
  }
  if (!digits) return "—";
  return "—";
}
