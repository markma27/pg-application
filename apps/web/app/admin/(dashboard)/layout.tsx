import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminThemeProvider } from "@/components/admin-theme-provider";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] p-8 text-center text-slate-600">
        <p className="max-w-md">
          Supabase is not configured. Add{" "}
          <code className="rounded bg-slate-200 px-1 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="rounded bg-slate-200 px-1 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          to your environment.
        </p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("full_name, email")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!admin) {
    redirect("/admin/login?error=unauthorized");
  }

  return (
    <AdminThemeProvider>
      <AdminShell profile={{ fullName: admin.full_name, email: admin.email }}>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
