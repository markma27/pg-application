import { supabaseAdmin } from "../supabase.js";
import { env } from "../env.js";

/**
 * Recipient for new-application emails: portal_settings row when set, otherwise env default.
 */
export async function getNotificationRecipientEmail(): Promise<string> {
  if (!supabaseAdmin) {
    return env.APPLICATION_NOTIFICATION_EMAIL;
  }

  const { data, error } = await supabaseAdmin
    .from("portal_settings")
    .select("notification_recipient_email")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.warn("portal_settings read failed; using env default.", error.message);
    return env.APPLICATION_NOTIFICATION_EMAIL;
  }

  const fromDb = data?.notification_recipient_email?.trim();
  if (fromDb) {
    return fromDb;
  }

  return env.APPLICATION_NOTIFICATION_EMAIL;
}
