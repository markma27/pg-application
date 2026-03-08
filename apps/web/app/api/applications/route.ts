import { NextResponse } from "next/server";

/**
 * Proxies form submissions to the backend. The form always posts to /api/applications
 * on the same domain; this route forwards to the real backend so the API URL is never
 * exposed to users.
 */
export async function POST(request: Request) {
  const backendUrl = process.env.API_URL?.replace(/\/$/, "");
  if (!backendUrl) {
    console.error("API_URL is not set");
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
