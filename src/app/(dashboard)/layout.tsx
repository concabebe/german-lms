import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return (
    <DashboardShell
      user={user}
      userName={profile?.full_name || user.user_metadata?.full_name || user.email || ""}
      isAdmin={profile?.role === "admin"}
    >
      {children}
    </DashboardShell>
  );
}
