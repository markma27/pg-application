export default function AdminUsersPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8">
      <h2 className="text-lg font-semibold text-[#0c2742]">Users</h2>
      <p className="mt-2 text-sm text-slate-600">
        Internal user management will connect to Supabase Auth and <code>admin_users</code> here.
      </p>
    </div>
  );
}
