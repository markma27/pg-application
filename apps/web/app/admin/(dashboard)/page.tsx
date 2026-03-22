import { createClient } from "@/lib/supabase/server";
import type { AdminApplicationRow } from "@/components/admin-applications-table";
import { AdminApplicationsTable } from "@/components/admin-applications-table";
import { Card } from "@/components/ui/card";

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

  const todayStart = startOfTodayIso();

  const base = () => supabase.from("applications").select("*", { count: "exact", head: true });

  const [{ count: todayCount }, { count: pendingCount }, { count: inProgressCount }, { count: processedCount }] =
    await Promise.all([
      base().is("deleted_at", null).gte("created_at", todayStart),
      base().is("deleted_at", null).eq("status", "New"),
      base().is("deleted_at", null).eq("status", "In Progress"),
      base().is("deleted_at", null).eq("status", "Processed"),
    ]);

  const { data: rawRows, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      reference,
      primary_contact_name,
      email,
      overall_outcome,
      status,
      created_at,
      sla_due_at,
      deleted_at,
      assignee:admin_users!applications_assignee_id_fkey(full_name)
    `,
    )
    .order("created_at", { ascending: false });

  let rows: AdminApplicationRow[] = [];

  if (error) {
    const { data: simple } = await supabase
      .from("applications")
      .select(
        "id, reference, primary_contact_name, email, overall_outcome, status, created_at, sla_due_at, deleted_at, assignee_id",
      )
      .order("created_at", { ascending: false });

    rows =
      simple?.map((r) => ({
        id: r.id,
        reference: r.reference,
        primary_contact_name: r.primary_contact_name,
        email: r.email,
        overall_outcome: r.overall_outcome,
        status: r.status,
        created_at: r.created_at,
        sla_due_at: r.sla_due_at,
        deleted_at: r.deleted_at,
        assignee_name: null,
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
          overall_outcome: r.overall_outcome,
          status: r.status,
          created_at: r.created_at,
          sla_due_at: r.sla_due_at,
          deleted_at: r.deleted_at,
          assignee_name: assignee?.full_name ?? null,
        };
      }) ?? [];
  }

  const cards = [
    { label: "Today's Applications", value: todayCount ?? 0, className: "bg-slate-200/90" },
    { label: "Pending Applications", value: pendingCount ?? 0, className: "bg-emerald-100/90" },
    { label: "In Progress Applications", value: inProgressCount ?? 0, className: "bg-sky-100/90" },
    { label: "Processed Applications", value: processedCount ?? 0, className: "bg-emerald-100/90" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className={`border-0 p-5 ${c.className}`}>
            <p className="text-sm font-medium text-slate-700">{c.label}</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-[#0c2742]">{c.value}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#0c2742]">Applications</h2>
        <p className="mt-1 text-sm text-slate-600">
          Submissions from the public form. <strong>Assessment</strong> shows the routing outcome from shared
          pricing rules (PG fit, JM referral, or manual review).
        </p>
        <div className="mt-6">
          <AdminApplicationsTable rows={rows} />
        </div>
      </div>
    </div>
  );
}
