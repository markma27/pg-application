"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  isWorkflowStatus,
  type WorkflowStatus,
} from "@/lib/admin/application-workflow-status";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

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

/** Soft-delete: sets `deleted_at`. Hidden from the dashboard list unless “Show deleted” is on. */
export async function softDeleteApplication(
  applicationId: string,
): Promise<{ ok?: true; error?: string }> {
  const parsed = uuid.safeParse(applicationId);
  if (!parsed.success) {
    return { error: "Invalid application." };
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

  const { data: row, error: fetchErr } = await supabase
    .from("applications")
    .select("id, deleted_at, reference")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { error: "Application not found." };
  }
  if (row.deleted_at) {
    return { error: "This application is already deleted." };
  }

  const now = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("applications")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", applicationId);

  if (upErr) {
    return { error: upErr.message };
  }

  const { error: auditErr } = await supabase.from("application_audit_events").insert({
    application_id: applicationId,
    event_type: "application_deleted",
    actor_type: "admin",
    actor_admin_id: admin.id,
    actor_label: admin.full_name,
    detail: { reference: row.reference },
  });

  if (auditErr) {
    console.warn("application_audit_events insert failed (delete):", auditErr);
  }

  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/admin");
  return { ok: true };
}
