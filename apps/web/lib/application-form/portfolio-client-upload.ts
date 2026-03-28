import { createClient } from "@/lib/supabase/client";
import type { PartialEntity } from "./types";

/** Must match `PORTFOLIO_STORAGE_BUCKET` in @pg/submission (kept local to avoid bundling server code in the browser). */
const PORTFOLIO_BUCKET = "application-portfolio";

export type PrepareSlot = {
  entityFormId: string;
  items: { path: string; token: string; originalName: string }[];
};

/** Uploads local File objects to signed URLs returned by prepare. */
export async function uploadPreparedPortfolioFiles(slots: PrepareSlot[], entities: PartialEntity[]): Promise<void> {
  const supabase = createClient();

  for (const slot of slots) {
    const entity = entities.find((e) => e.id === slot.entityFormId);
    const files = entity?.existingPortfolioReportFiles ?? [];
    for (let j = 0; j < slot.items.length; j++) {
      const item = slot.items[j];
      const file = files[j];
      if (!item || !file) {
        throw new Error("Portfolio upload mismatch. Please try again.");
      }
      const { error } = await supabase.storage
        .from(PORTFOLIO_BUCKET)
        .uploadToSignedUrl(item.path, item.token, file);
      if (error) {
        throw new Error(error.message);
      }
    }
  }
}
