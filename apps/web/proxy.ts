import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Next.js 16+ convention (replaces `middleware.ts`). Runs at the network boundary before the request completes. */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/report/pricing-calculator") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/pricing-calculator";
    return NextResponse.redirect(url, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
