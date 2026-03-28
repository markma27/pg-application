import { Suspense } from "react";
import { AuthCallbackClient } from "./auth-callback-client";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] p-8 text-slate-600">
          Loading…
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
