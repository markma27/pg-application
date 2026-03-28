"use server";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "application-portfolio";

/** Signed URL for admins to download a portfolio file uploaded with an application. */
export async function getPortfolioDocumentSignedUrl(
  applicationId: string,
  storagePath: string,
): Promise<{ url?: string; error?: string }> {
  if (!storagePath.startsWith(`${applicationId}/`)) {
    return { error: "Invalid file path." };
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

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? "Could not create download link." };
  }

  return { url: data.signedUrl };
}
