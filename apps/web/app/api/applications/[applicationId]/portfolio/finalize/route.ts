import {
  finalizeApplicationPortfolioUploads,
  portfolioFinalizeRequestSchema,
} from "@pg/submission/portfolio-routes";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { consumePortfolioUploadRateLimit } from "@/lib/rate-limit";
import { getRateLimitClientKey } from "@/lib/request-client-key";

export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ applicationId: string }> }>,
) {
  const { applicationId } = await context.params;

  try {
    await consumePortfolioUploadRateLimit(getRateLimitClientKey(request));
  } catch {
    return NextResponse.json(
      { message: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = portfolioFinalizeRequestSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }
    throw e;
  }

  try {
    await finalizeApplicationPortfolioUploads({
      applicationId,
      uploadToken: parsed.uploadToken,
      documents: parsed.documents,
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Portfolio finalize error:", error);
    const message = error instanceof Error ? error.message : "Could not save portfolio documents.";
    const status =
      message.includes("Invalid or expired upload session") || message.includes("not found")
        ? 403
        : 400;
    return NextResponse.json({ message }, { status });
  }
}
