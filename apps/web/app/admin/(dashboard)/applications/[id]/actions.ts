"use server";

import { revalidatePath } from "next/cache";
import {
  isWorkflowStatus,
  type WorkflowStatus,
} from "@/lib/admin/application-workflow-status";
import { createClient } from "@/lib/supabase/server";

export async function updateApplicationWorkflowStatus(
  applicationId: string,
  nextStatus: WorkflowStatus,
): Promise<{ ok?: true; error?: string }> {
  if (!isWorkflowStatus(nextStatus)) {
    return { error: "Invalid status." };
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
    .select("id, full_name")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminErr || !admin) {
    return { error: "Unauthorized." };
  }

  const { data: before, error: fetchErr } = await supabase
    .from("applications")
    .select("status, deleted_at")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchErr || !before) {
    return { error: "Application not found." };
  }
  if (before.deleted_at) {
    return { error: "Cannot change status for a deleted application." };
  }

  const fromStatus = before.status as string;

  const { error: upErr } = await supabase
    .from("applications")
    .update({ status: nextStatus })
    .eq("id", applicationId);

  if (upErr) {
    return { error: upErr.message };
  }

  const { error: auditErr } = await supabase.from("application_audit_events").insert({
    application_id: applicationId,
    event_type: "status_changed",
    actor_type: "admin",
    actor_admin_id: admin.id,
    actor_label: admin.full_name,
    detail: { from_status: fromStatus, to_status: nextStatus },
  });

  if (auditErr) {
    console.warn("application_audit_events insert failed:", auditErr);
  }

  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/admin");
  return { ok: true };
}
