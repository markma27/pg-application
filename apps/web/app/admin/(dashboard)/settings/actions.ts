"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePortalAdmin } from "@/lib/admin/users-actions";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().email("Enter a valid email address.");

export async function updateNotificationRecipientEmail(
  prevState: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  void prevState;

  const gate = await requirePortalAdmin();
  if (!gate.ok) {
    return { error: gate.error };
  }

  const raw = (formData.get("notification_recipient_email") as string | null) ?? "";
  const trimmed = raw.trim();

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Server not configured." };
  }

  if (trimmed === "") {
    const { error } = await supabase
      .from("portal_settings")
      .update({ notification_recipient_email: null, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      return { error: "Could not save settings." };
    }
    revalidatePath("/admin/settings");
    return { ok: true };
  }

  const parsed = emailSchema.safeParse(trimmed);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const { error } = await supabase
    .from("portal_settings")
    .update({
      notification_recipient_email: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { error: "Could not save settings." };
  }

  revalidatePath("/admin/settings");
  return { ok: true };
}
