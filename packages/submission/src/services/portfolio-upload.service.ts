import type { FullApplicationSubmission } from "@pg/shared";
import { supabaseAdmin } from "../supabase.js";

export const PORTFOLIO_STORAGE_BUCKET = "application-portfolio" as const;
export const MAX_PORTFOLIO_DOCS_PER_ENTITY = 5;
export const MAX_PORTFOLIO_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
]);

export function sanitizePortfolioFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "");
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return (cleaned || "document").slice(0, 120);
}

function isAllowedPortfolioType(contentType: string, filename: string): boolean {
  const t = contentType.trim().toLowerCase();
  if (ALLOWED_CONTENT_TYPES.has(t)) return true;
  const lower = filename.toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".csv")
  );
}

export type PortfolioPrepareFile = {
  name: string;
  contentType: string;
  size: number;
};

export type PortfolioPrepareSlot = {
  entityFormId: string;
  items: {
    path: string;
    signedUrl: string;
    token: string;
    originalName: string;
  }[];
};

export async function prepareApplicationPortfolioUploads(params: {
  applicationId: string;
  uploads: { entityFormId: string; files: PortfolioPrepareFile[] }[];
}): Promise<{ slots: PortfolioPrepareSlot[] }> {
  if (!supabaseAdmin) {
    throw new Error("Storage is not configured.");
  }

  const { applicationId, uploads } = params;
  if (!uploads.length) {
    return { slots: [] };
  }

  const { data: appRow, error: appErr } = await supabaseAdmin
    .from("applications")
    .select("id, form_submission")
    .eq("id", applicationId)
    .maybeSingle();

  if (appErr || !appRow) {
    throw new Error(appErr?.message ?? "Application not found.");
  }

  const submission = appRow.form_submission as FullApplicationSubmission | null;
  const allowedIds = new Set((submission?.entities ?? []).map((e) => e.id));

  const { data: entityRows, error: entErr } = await supabaseAdmin
    .from("application_entities")
    .select("id, form_submission_entity_id, portfolio_status")
    .eq("application_id", applicationId);

  if (entErr) {
    throw new Error(entErr.message);
  }

  const byFormId = new Map<string, { id: string; portfolio_status: string }>();
  for (const row of entityRows ?? []) {
    const fid = row.form_submission_entity_id as string | null;
    if (fid) {
      byFormId.set(fid, { id: row.id as string, portfolio_status: row.portfolio_status as string });
    }
  }

  const slots: PortfolioPrepareSlot[] = [];
  const seenEntity = new Set<string>();

  for (const group of uploads) {
    if (seenEntity.has(group.entityFormId)) {
      throw new Error("Duplicate entity in upload request.");
    }
    seenEntity.add(group.entityFormId);

    if (!allowedIds.has(group.entityFormId)) {
      throw new Error("Unknown entity for this application.");
    }

    const ent = byFormId.get(group.entityFormId);
    if (!ent) {
      throw new Error("Entity record not found for upload.");
    }
    if (ent.portfolio_status !== "existing_clean") {
      throw new Error("Portfolio documents are only allowed for an existing portfolio.");
    }

    if (group.files.length > MAX_PORTFOLIO_DOCS_PER_ENTITY) {
      throw new Error(`At most ${MAX_PORTFOLIO_DOCS_PER_ENTITY} files per entity.`);
    }

    const items: PortfolioPrepareSlot["items"] = [];

    for (let i = 0; i < group.files.length; i++) {
      const f = group.files[i]!;
      if (!f.name?.trim()) {
        throw new Error("Each file must have a name.");
      }
      if (f.size > MAX_PORTFOLIO_FILE_BYTES) {
        throw new Error(`Each file must be at most ${MAX_PORTFOLIO_FILE_BYTES / (1024 * 1024)} MB.`);
      }
      if (f.size < 1) {
        throw new Error("Empty files are not allowed.");
      }
      if (!isAllowedPortfolioType(f.contentType || "application/octet-stream", f.name)) {
        throw new Error("Only PDF or Excel (.xlsx, .xls) or CSV files are allowed.");
      }

      const safe = sanitizePortfolioFilename(f.name);
      const path = `${applicationId}/${ent.id}/${String(i).padStart(2, "0")}_${safe}`;

      const { data: signed, error: upErr } = await supabaseAdmin.storage
        .from(PORTFOLIO_STORAGE_BUCKET)
        .createSignedUploadUrl(path, { upsert: false });

      if (upErr || !signed) {
        throw new Error(upErr?.message ?? "Could not create upload URL.");
      }

      items.push({
        path: signed.path,
        signedUrl: signed.signedUrl,
        token: signed.token,
        originalName: f.name,
      });
    }

    slots.push({ entityFormId: group.entityFormId, items });
  }

  return { slots };
}

export type PortfolioFinalizeFile = {
  path: string;
  originalName: string;
  sizeBytes: number;
  contentType: string;
};

export async function finalizeApplicationPortfolioUploads(params: {
  applicationId: string;
  documents: { entityFormId: string; files: PortfolioFinalizeFile[] }[];
}): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Storage is not configured.");
  }

  const { applicationId, documents } = params;
  if (!documents.length) return;

  const { data: entityRows, error: entErr } = await supabaseAdmin
    .from("application_entities")
    .select("id, form_submission_entity_id, portfolio_status")
    .eq("application_id", applicationId);

  if (entErr) {
    throw new Error(entErr.message);
  }

  const byFormId = new Map<string, { id: string; portfolio_status: string }>();
  for (const row of entityRows ?? []) {
    const fid = row.form_submission_entity_id as string | null;
    if (fid) {
      byFormId.set(fid, { id: row.id as string, portfolio_status: row.portfolio_status as string });
    }
  }

  for (const group of documents) {
    const ent = byFormId.get(group.entityFormId);
    if (!ent) {
      throw new Error("Entity record not found.");
    }
    if (ent.portfolio_status !== "existing_clean") {
      throw new Error("Portfolio documents are only stored for an existing portfolio.");
    }
    if (group.files.length > MAX_PORTFOLIO_DOCS_PER_ENTITY) {
      throw new Error(`At most ${MAX_PORTFOLIO_DOCS_PER_ENTITY} files per entity.`);
    }

    const portfolio_documents = group.files.map((f) => {
      const prefix = `${applicationId}/${ent.id}/`;
      if (!f.path.startsWith(prefix)) {
        throw new Error("Invalid storage path.");
      }
      return {
        storage_path: f.path,
        original_name: f.originalName,
        content_type: f.contentType,
        size_bytes: f.sizeBytes,
      };
    });

    const { error: upErr } = await supabaseAdmin
      .from("application_entities")
      .update({ portfolio_documents })
      .eq("id", ent.id)
      .eq("application_id", applicationId);

    if (upErr) {
      throw new Error(upErr.message);
    }
  }
}
