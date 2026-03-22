import { NextResponse } from "next/server";

function resolveBackendUrl(): string | undefined {
  const raw = process.env.API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  // Empty `API_URL=` in env must not block the dev default (see `??` vs empty string).
  if (process.env.NODE_ENV === "development") return "http://localhost:4000";
  return undefined;
}

/**
 * Proxies form submissions to the backend. The form always posts to /api/applications
 * on the same domain; this route forwards to the real backend so the API URL is never
 * exposed to users.
 */
export async function POST(request: Request) {
  const backendUrl = resolveBackendUrl();
  if (!backendUrl) {
    console.error("API_URL is not set. Set API_URL to your backend (e.g. http://localhost:4000 or your production API).");
    return NextResponse.json(
      { message: "Form submission is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${backendUrl}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Applications proxy error:", err);
    return NextResponse.json(
      { message: "Submission failed. Please try again later." },
      { status: 502 }
    );
  }
}
