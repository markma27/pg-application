import { createClient } from "@/lib/supabase/server";
import { NotificationSettingsForm } from "./notification-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  let initialEmail: string | null = null;
  if (supabase) {
    const { data } = await supabase.from("portal_settings").select("notification_recipient_email").eq("id", 1).maybeSingle();
    initialEmail = (data?.notification_recipient_email as string | null) ?? null;
  }

  const envFallback =
    process.env.APPLICATION_NOTIFICATION_EMAIL?.trim() || "applications@portfolioguardian.com.au";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <h2 className="text-lg font-semibold text-[#0c2742]">Settings</h2>
      <p className="mt-2 text-sm text-slate-600">
        Configure portal notifications. New application alerts are sent via Resend using your verified domain.
      </p>

      <div className="mt-8 border-t border-slate-100 pt-8">
        <NotificationSettingsForm initialEmail={initialEmail} envFallbackHint={envFallback} />
      </div>
    </div>
  );
}
