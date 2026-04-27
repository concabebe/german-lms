import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchInsightsData } from "@/lib/utils/aggregation";
import { InsightsContent } from "./insights-content";

interface PageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    respondentType?: string;
    interviewerId?: string;
  }>;
}

export default async function InsightsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const data = await fetchInsightsData({
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    respondentType: sp.respondentType,
    interviewerId: sp.interviewerId,
  });

  let interviewers: { id: string; name: string }[] = [];
  if (isAdmin) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("role", "user");
    interviewers = (users || []).map((u) => ({
      id: u.id,
      name: u.full_name,
    }));
  }

  return (
    <InsightsContent
      data={data}
      isAdmin={isAdmin}
      interviewers={interviewers}
      currentFilters={sp}
    />
  );
}
