import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminLoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{ error?: string; detail?: string; info?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/admin");
    }
  }

  return <AdminLoginForm errorKey={sp.error} errorDetail={sp.detail} infoKey={sp.info} />;
}
