"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(200, "Name is too long.");

export async function updatePortalProfileName(
  prevState: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  void prevState;
  const raw = (formData.get("full_name") as string | null) ?? "";
  const parsed = nameSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid name." };
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

  const { error } = await supabase
    .from("admin_users")
    .update({ full_name: parsed.data })
    .eq("id", user.id)
    .eq("is_active", true);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}
