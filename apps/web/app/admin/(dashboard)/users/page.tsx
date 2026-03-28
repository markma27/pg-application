import { createClient } from "@/lib/supabase/server";
import { UsersClient, type PortalUserRow } from "./users-client";

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
    .select("id, email, full_name, role, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const users = (rows ?? []) as PortalUserRow[];

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
