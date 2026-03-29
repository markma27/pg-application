import {
  prepareApplicationPortfolioUploads,
  MAX_PORTFOLIO_DOCS_PER_ENTITY,
  MAX_PORTFOLIO_FILE_BYTES,
} from "@pg/submission/portfolio";
import { NextResponse } from "next/server";

/**
 * Returns signed upload URLs for portfolio report files (after the application JSON was saved).
 * Client uploads via Supabase Storage signed URL, then calls finalize.
 */
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

  const uploads = (body as { uploads?: unknown }).uploads;
  if (!Array.isArray(uploads)) {
    return NextResponse.json({ message: "Expected uploads array." }, { status: 400 });
  }

  for (const u of uploads) {
    if (!u || typeof u !== "object") {
      return NextResponse.json({ message: "Invalid upload entry." }, { status: 400 });
    }
    const rec = u as Record<string, unknown>;
    if (typeof rec.entityFormId !== "string" || !rec.entityFormId.trim()) {
      return NextResponse.json({ message: "Each upload needs entityFormId." }, { status: 400 });
    }
    if (!Array.isArray(rec.files)) {
      return NextResponse.json({ message: "Each upload needs files array." }, { status: 400 });
    }
    if (rec.files.length > MAX_PORTFOLIO_DOCS_PER_ENTITY) {
      return NextResponse.json(
        { message: `At most ${MAX_PORTFOLIO_DOCS_PER_ENTITY} files per entity.` },
        { status: 400 },
      );
    }
    for (const f of rec.files) {
      if (!f || typeof f !== "object") {
        return NextResponse.json({ message: "Invalid file descriptor." }, { status: 400 });
      }
      const file = f as Record<string, unknown>;
      if (typeof file.name !== "string") {
        return NextResponse.json({ message: "Each file needs a name." }, { status: 400 });
      }
      if (typeof file.size !== "number" || file.size > MAX_PORTFOLIO_FILE_BYTES) {
        return NextResponse.json(
          { message: `Each file must be at most ${MAX_PORTFOLIO_FILE_BYTES / (1024 * 1024)} MB.` },
          { status: 400 },
        );
      }
    }
  }

  try {
    const result = await prepareApplicationPortfolioUploads({
      applicationId,
      uploads: uploads as { entityFormId: string; files: { name: string; contentType: string; size: number }[] }[],
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Portfolio prepare error:", error);
    const message = error instanceof Error ? error.message : "Could not prepare uploads.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
