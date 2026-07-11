import { supabaseAdmin } from "../supabase.js";
import { env } from "../env.js";

/** Always CC'd on new-application staff notifications (in addition to portal/env recipient). */
const ADDITIONAL_NOTIFICATION_RECIPIENT = "mayinxing@gmail.com";

/**
 * Recipients for new-application staff emails: portal/env primary plus hardcoded additional address.
 */
export async function getNotificationRecipientEmails(): Promise<string[]> {
  const primary = await getNotificationRecipientEmail();
  const recipients = [primary];
  const extra = ADDITIONAL_NOTIFICATION_RECIPIENT.trim();
  if (extra && primary.trim().toLowerCase() !== extra.toLowerCase()) {
    recipients.push(extra);
  }
  return recipients;
}

/**
 * Primary recipient for new-application emails: portal_settings row when set, otherwise env default.
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
