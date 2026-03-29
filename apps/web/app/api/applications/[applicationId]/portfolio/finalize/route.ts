import {
  finalizeApplicationPortfolioUploads,
  MAX_PORTFOLIO_DOCS_PER_ENTITY,
  MAX_PORTFOLIO_FILE_BYTES,
} from "@pg/submission/portfolio";
import { NextResponse } from "next/server";

/** Persists portfolio document metadata on application_entities after signed uploads complete. */
export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ applicationId: string }> }>,
) {
  const { applicationId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const documents = (body as { documents?: unknown }).documents;
  if (!Array.isArray(documents)) {
    return NextResponse.json({ message: "Expected documents array." }, { status: 400 });
  }

  for (const d of documents) {
    if (!d || typeof d !== "object") {
      return NextResponse.json({ message: "Invalid document group." }, { status: 400 });
    }
    const rec = d as Record<string, unknown>;
    if (typeof rec.entityFormId !== "string" || !rec.entityFormId.trim()) {
      return NextResponse.json({ message: "Each group needs entityFormId." }, { status: 400 });
    }
    if (!Array.isArray(rec.files)) {
      return NextResponse.json({ message: "Each group needs files array." }, { status: 400 });
    }
    if (rec.files.length > MAX_PORTFOLIO_DOCS_PER_ENTITY) {
      return NextResponse.json(
        { message: `At most ${MAX_PORTFOLIO_DOCS_PER_ENTITY} files per entity.` },
        { status: 400 },
      );
    }
    for (const f of rec.files) {
      if (!f || typeof f !== "object") {
        return NextResponse.json({ message: "Invalid file metadata." }, { status: 400 });
      }
      const file = f as Record<string, unknown>;
      if (typeof file.path !== "string" || !file.path.trim()) {
        return NextResponse.json({ message: "Each file needs path." }, { status: 400 });
      }
      if (typeof file.sizeBytes !== "number" || file.sizeBytes > MAX_PORTFOLIO_FILE_BYTES) {
        return NextResponse.json({ message: "Invalid file size." }, { status: 400 });
      }
    }
  }

  try {
    await finalizeApplicationPortfolioUploads({
      applicationId,
      documents: documents as {
        entityFormId: string;
        files: { path: string; originalName: string; sizeBytes: number; contentType: string }[];
      }[],
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Portfolio finalize error:", error);
    const message = error instanceof Error ? error.message : "Could not save portfolio documents.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
