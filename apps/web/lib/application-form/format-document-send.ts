import type { DocumentSendToValue } from "./types";

/** Display labels for document routing: `trustee` → "Individual", `adviser` → "Adviser" (matches the application form UI). */
export function formatDocumentSendToDisplay(value: DocumentSendToValue | undefined | null): string | undefined {
  if (value == null || value === "") return undefined;
  if (value === "not_required") return "Not required";
  if (Array.isArray(value) && value.length > 0) {
    return value.map((v) => (v === "trustee" ? "Individual" : "Adviser")).join(", ");
  }
  return undefined;
}
