import { fullApplicationSubmissionSchema } from "@pg/shared";
import { submitApplication } from "@pg/submission/submit";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { consumeApplicationSubmitRateLimit } from "@/lib/rate-limit";
import { getRateLimitClientKey } from "@/lib/request-client-key";

/**
 * Processes form submissions on the same deployment (no separate API_URL).
 * POST body is validated and persisted via @pg/submission (Supabase, notifications).
 */
export async function POST(request: Request) {
  try {
    await consumeApplicationSubmitRateLimit(getRateLimitClientKey(request));
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

  try {
    const payload = fullApplicationSubmissionSchema.parse(body);
    const result = await submitApplication(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Validation failed." }, { status: 400 });
    }
    console.error(
      "Application submission error:",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
}
