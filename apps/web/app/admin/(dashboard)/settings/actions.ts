"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().email("Enter a valid email address.");

export async function updateNotificationRecipientEmail(
  prevState: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  void prevState;
  const raw = (formData.get("notification_recipient_email") as string | null) ?? "";
  const trimmed = raw.trim();

  if (trimmed === "") {
    const supabase = await createClient();
    if (!supabase) {
      return { error: "Server not configured." };
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Not signed in." };
    }
    const { data: admin, error: adminErr } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (adminErr || !admin) {
      return { error: "Unauthorized." };
    }
    const { error } = await supabase
      .from("portal_settings")
      .update({ notification_recipient_email: null, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      return { error: error.message };
    }
    revalidatePath("/admin/settings");
    return { ok: true };
  }

  const parsed = emailSchema.safeParse(trimmed);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Server not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { data: admin, error: adminErr } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminErr || !admin) {
    return { error: "Unauthorized." };
  }

  const { error } = await supabase
    .from("portal_settings")
    .update({
      notification_recipient_email: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings");
  return { ok: true };
}
