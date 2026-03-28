"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendPasswordResetEmail, sendUserInvitationEmail } from "@/lib/email/resend";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getSiteOrigin } from "@/lib/site-url";

const emailSchema = z.string().email("Enter a valid email address.");
const nameSchema = z.string().trim().min(1, "Enter a name.").max(200);
const roleSchema = z.enum(["admin", "general"]);

async function requirePortalAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Server not configured." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }
  const { data: row, error } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !row) {
    return { ok: false, error: "Unauthorized." };
  }
  if (row.role !== "admin") {
    return { ok: false, error: "Only administrators can manage users." };
  }
  return { ok: true, userId: user.id };
}

export async function requestPasswordReset(
  prevState: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  void prevState;
  const raw = (formData.get("email") as string | null) ?? "";
  const parsed = emailSchema.safeParse(raw.trim());
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  let service;
  try {
    service = createServiceRoleClient();
  } catch {
    return { error: "Server not configured." };
  }

  const origin = getSiteOrigin();
  const nextPath = "/admin/update-password";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const { data, error } = await service.auth.admin.generateLink({
    type: "recovery",
    email: parsed.data,
    options: { redirectTo },
  });

  if (error || !data?.properties?.action_link) {
    // Do not reveal whether the email exists or mail delivery failed upstream
    return { ok: true };
  }

  const sendResult = await sendPasswordResetEmail(parsed.data, data.properties.action_link);
  if (!sendResult.ok) {
    return { error: sendResult.error };
  }
  return { ok: true };
}

const inviteSchema = z.object({
  email: emailSchema,
  full_name: nameSchema,
  role: roleSchema,
});

export async function invitePortalUser(
  prevState: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  void prevState;
  const gate = await requirePortalAdmin();
  if (!gate.ok) {
    return { error: gate.error };
  }

  const parsed = inviteSchema.safeParse({
    email: (formData.get("email") as string | null)?.trim() ?? "",
    full_name: (formData.get("full_name") as string | null) ?? "",
    role: (formData.get("role") as string | null) ?? "general",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let service;
  try {
    service = createServiceRoleClient();
  } catch {
    return { error: "Server not configured." };
  }

  const { data: existing } = await service.from("admin_users").select("id").eq("email", parsed.data.email).maybeSingle();
  if (existing) {
    return { error: "A user with this email already exists." };
  }

  const origin = getSiteOrigin();
  const inviteNext = "/admin/update-password";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(inviteNext)}`;

  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email: parsed.data.email,
    email_confirm: false,
    user_metadata: { full_name: parsed.data.full_name },
  });

  if (createErr || !created.user?.id) {
    const msg = createErr?.message ?? "Could not create user.";
    if (msg.toLowerCase().includes("already been registered") || msg.toLowerCase().includes("already registered")) {
      return { error: "This email is already registered. Remove the existing account first or use a different email." };
    }
    return { error: msg };
  }

  const userId = created.user.id;

  const { error: insertErr } = await service.from("admin_users").insert({
    id: userId,
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    role: parsed.data.role,
    is_active: true,
  });

  if (insertErr) {
    await service.auth.admin.deleteUser(userId);
    return { error: insertErr.message };
  }

  const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: "invite",
    email: parsed.data.email,
    options: { redirectTo },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    const { data: magic, error: magicErr } = await service.auth.admin.generateLink({
      type: "magiclink",
      email: parsed.data.email,
      options: { redirectTo },
    });
    if (magicErr || !magic?.properties?.action_link) {
      await service.from("admin_users").delete().eq("id", userId);
      await service.auth.admin.deleteUser(userId);
      return { error: linkErr?.message ?? magicErr?.message ?? "Could not create invitation link." };
    }
    const sent = await sendUserInvitationEmail(parsed.data.email, parsed.data.full_name, magic.properties.action_link);
    if (!sent.ok) {
      await service.from("admin_users").delete().eq("id", userId);
      await service.auth.admin.deleteUser(userId);
      return { error: sent.error };
    }
    revalidatePath("/admin/users");
    return { ok: true };
  }

  const sent = await sendUserInvitationEmail(parsed.data.email, parsed.data.full_name, linkData.properties.action_link);
  if (!sent.ok) {
    await service.from("admin_users").delete().eq("id", userId);
    await service.auth.admin.deleteUser(userId);
    return { error: sent.error };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function removePortalUser(userId: string): Promise<{ ok?: boolean; error?: string }> {
  const gate = await requirePortalAdmin();
  if (!gate.ok) {
    return { error: gate.error };
  }
  if (userId === gate.userId) {
    return { error: "You cannot remove your own account." };
  }

  let service;
  try {
    service = createServiceRoleClient();
  } catch {
    return { error: "Server not configured." };
  }

  const { data: target } = await service
    .from("admin_users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!target) {
    return { error: "User not found." };
  }

  if (target.role === "admin") {
    const { count } = await service
      .from("admin_users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("is_active", true);
    if ((count ?? 0) <= 1) {
      return { error: "Cannot remove the last active administrator." };
    }
  }

  const { error: delRowErr } = await service.from("admin_users").delete().eq("id", userId);
  if (delRowErr) {
    return { error: delRowErr.message };
  }

  const { error: delAuthErr } = await service.auth.admin.deleteUser(userId);
  if (delAuthErr) {
    return { error: delAuthErr.message };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
