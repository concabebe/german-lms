import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SessionsContent } from "./sessions-content";

export default async function SessionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return <SessionsContent isAdmin={profile?.role === "admin"} />;
}
