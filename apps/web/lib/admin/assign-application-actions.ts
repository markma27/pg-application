"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendApplicationAssigneeNotificationEmail } from "@/lib/email/resend";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

export async function assignApplicationToAdmin(
  applicationId: string,
  assigneeId: string | null,
): Promise<{ ok: true; emailWarning?: string } | { ok: false; error: string }> {
  const appParsed = uuid.safeParse(applicationId);
  if (!appParsed.success) {
    return { ok: false, error: "Invalid application." };
  }
  const nextAssigneeId = assigneeId === "" || assigneeId == null ? null : assigneeId;
  if (nextAssigneeId) {
    const a = uuid.safeParse(nextAssigneeId);
    if (!a.success) {
      return { ok: false, error: "Invalid assignee." };
    }
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Server is not configured." };
  }

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: me } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!me) {
    return { ok: false, error: "Not allowed." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("applications")
    .select("id, assignee_id, reference, primary_contact_name, deleted_at")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Application not found." };
  }

  if (row.deleted_at) {
    return { ok: false, error: "This application is deleted." };
  }

  if (row.assignee_id === nextAssigneeId) {
    return { ok: true };
  }

  if (nextAssigneeId) {
    const { data: assignee, error: assigneeErr } = await supabase
      .from("admin_users")
      .select("id, email, full_name")
      .eq("id", nextAssigneeId)
      .eq("is_active", true)
      .maybeSingle();

    if (assigneeErr || !assignee) {
      return { ok: false, error: "That team member could not be found or is inactive." };
    }

    const { error: upErr } = await supabase
      .from("applications")
      .update({ assignee_id: nextAssigneeId, updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (upErr) {
      return { ok: false, error: upErr.message };
    }

    revalidatePath("/admin");
    revalidatePath(`/admin/applications/${applicationId}`);

    const emailRes = await sendApplicationAssigneeNotificationEmail(assignee.email, {
      assigneeName: assignee.full_name,
      reference: row.reference,
      primaryContactName: row.primary_contact_name,
      applicationId: row.id,
    });

    if (!emailRes.ok) {
      return {
        ok: true,
        emailWarning: `Assignee saved, but the notification email could not be sent: ${emailRes.error}`,
      };
    }

    return { ok: true };
  }

  const { error: clearErr } = await supabase
    .from("applications")
    .update({ assignee_id: null, updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (clearErr) {
    return { ok: false, error: clearErr.message };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/applications/${applicationId}`);

  return { ok: true };
}
