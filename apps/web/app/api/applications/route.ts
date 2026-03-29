import { fullApplicationSubmissionSchema } from "@pg/shared";
import { submitApplication } from "@pg/submission/submit";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Processes form submissions on the same deployment (no separate API_URL).
 * POST body is validated and persisted via @pg/submission (Supabase, notifications).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const payload = fullApplicationSubmissionSchema.parse(body);
    const result = await submitApplication(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("Application submission error:", error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
