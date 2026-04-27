import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchProductAnalysisData } from "@/lib/utils/product-analysis";
import { ProductAnalysisContent } from "./product-analysis-content";

export default async function ProductAnalysisPage() {
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

  if (profile?.role !== "admin") redirect("/sessions");

  const data = await fetchProductAnalysisData();

  return <ProductAnalysisContent data={data} userId={user.id} />;
}
