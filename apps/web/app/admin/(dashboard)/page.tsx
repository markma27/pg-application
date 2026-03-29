import { createClient } from "@/lib/supabase/server";
import type { AdminApplicationRow, AdminAssignableUser } from "@/components/admin-applications-table";
import { AdminDashboardStatFilters } from "@/components/admin-dashboard-stat-filters";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-950">
        Configure <code className="rounded bg-emerald-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-emerald-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to load
        applications.
      </div>
    );
  }

  const todayStartIso = startOfTodayIso();

  const base = () => supabase.from("applications").select("*", { count: "exact", head: true });

  const [
    { count: todayCount },
    { count: pendingCount },
    { count: inProgressCount },
    { count: documentsSentCount },
    { count: completedCount },
  ] = await Promise.all([
    base().is("deleted_at", null).gte("created_at", todayStartIso),
    base().is("deleted_at", null).eq("status", "pending"),
    base().is("deleted_at", null).eq("status", "in_progress"),
    base().is("deleted_at", null).eq("status", "documents_sent"),
    base().is("deleted_at", null).eq("status", "completed"),
  ]);

  const { data: adminTeamRaw } = await supabase
    .from("admin_users")
    .select("id, full_name, email")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  const assignableUsers: AdminAssignableUser[] =
    (adminTeamRaw as AdminAssignableUser[] | null)?.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
    })) ?? [];

  const { data: rawRows, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      reference,
      primary_contact_name,
      email,
      status,
      created_at,
      deleted_at,
      assignee_id,
      assignee:admin_users!applications_assignee_id_fkey(full_name)
    `,
    )
    .order("created_at", { ascending: false });

  let rows: AdminApplicationRow[] = [];

  if (error) {
    const { data: simple } = await supabase
      .from("applications")
      .select("id, reference, primary_contact_name, email, status, created_at, deleted_at, assignee_id")
      .order("created_at", { ascending: false });

    rows =
      simple?.map((r) => ({
        id: r.id,
        reference: r.reference,
        primary_contact_name: r.primary_contact_name,
        email: r.email,
        status: r.status,
        created_at: r.created_at,
        deleted_at: r.deleted_at,
        assignee_id: r.assignee_id ?? null,
        assignee_name: null,
        entity_count: 0,
      })) ?? [];
  } else {
    rows =
      rawRows?.map((r) => {
        const raw = r.assignee as { full_name: string } | { full_name: string }[] | null | undefined;
        const assignee = Array.isArray(raw) ? raw[0] : raw;
        return {
          id: r.id,
          reference: r.reference,
          primary_contact_name: r.primary_contact_name,
          email: r.email,
          status: r.status,
          created_at: r.created_at,
          deleted_at: r.deleted_at,
          assignee_id: r.assignee_id ?? null,
          assignee_name: assignee?.full_name ?? null,
          entity_count: 0,
        };
      }) ?? [];
  }

  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const { data: entityRows } = await supabase.from("application_entities").select("application_id").in("application_id", ids);
    const counts = new Map<string, number>();
    for (const row of entityRows ?? []) {
      const appId = row.application_id as string;
      counts.set(appId, (counts.get(appId) ?? 0) + 1);
    }
    rows = rows.map((r) => ({ ...r, entity_count: counts.get(r.id) ?? 0 }));
  }

  const cards = [
    {
      label: "Today's Applications",
      value: todayCount ?? 0,
      className: "bg-slate-200/90",
      preset: "today" as const,
    },
    {
      label: "Pending",
      value: pendingCount ?? 0,
      className: "bg-amber-50/95 ring-1 ring-amber-200/60",
      preset: "pending" as const,
    },
    {
      label: "In progress",
      value: inProgressCount ?? 0,
      className: "bg-sky-100/90",
      preset: "in_progress" as const,
    },
    {
      label: "Documents sent",
      value: documentsSentCount ?? 0,
      className: "bg-violet-100/90",
      preset: "documents_sent" as const,
    },
    {
      label: "Completed",
      value: completedCount ?? 0,
      className: "bg-emerald-100/90",
      preset: "completed" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <AdminDashboardStatFilters
        cards={cards}
        rows={rows}
        todayStartIso={todayStartIso}
        assignableUsers={assignableUsers}
      />
    </div>
  );
}
