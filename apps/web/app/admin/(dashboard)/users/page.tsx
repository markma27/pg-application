import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { UsersClient, type PortalUserRow } from "./users-client";

/** `email_confirmed_at` is set after the invite / recovery flow completes — until then, show pending. */
async function emailConfirmedByUserId(ids: string[]): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (ids.length === 0) return map;

  let service;
  try {
    service = createServiceRoleClient();
  } catch {
    for (const id of ids) map.set(id, true);
    return map;
  }

  await Promise.all(
    ids.map(async (id) => {
      const { data, error } = await service.auth.admin.getUserById(id);
      if (error || !data?.user) {
        map.set(id, false);
        return;
      }
      map.set(id, Boolean(data.user.email_confirmed_at));
    }),
  );

  return map;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  if (!supabase) {
    return <p className="text-slate-600">Supabase is not configured.</p>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: me } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role, created_at, last_login_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const baseRows = rows ?? [];
  const confirmedMap = await emailConfirmedByUserId(baseRows.map((r) => r.id));

  const users: PortalUserRow[] = baseRows.map((r) => ({
    id: r.id,
    email: r.email,
    full_name: r.full_name,
    role: r.role,
    created_at: r.created_at,
    last_login_at: r.last_login_at,
    status: confirmedMap.get(r.id) ? "active" : "pending",
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <h2 className="text-lg font-semibold text-[#0c2742]">Users</h2>
      <p className="mt-2 text-sm text-slate-600">
        Portal accounts use email to sign in. Administrators can invite team members and remove access.
      </p>
      <div className="mt-8">
        <UsersClient
          users={users}
          isAdmin={me?.role === "admin"}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
