import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewContent } from "./review-content";
import type { Json } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewPage({ params }: PageProps) {
  const { id: sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    redirect("/sessions");
  }

  if (session.created_by !== user.id) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== "admin") {
      redirect("/sessions");
    }
  }

  const [responsesRes, notesRes] = await Promise.all([
    supabase
      .from("responses")
      .select("question_key, answer_value")
      .eq("session_id", sessionId),
    supabase
      .from("session_notes")
      .select("section_key, note_text, tagged_questions, sentiment_hint")
      .eq("session_id", sessionId),
  ]);

  const responses: Record<string, Json> = {};
  if (responsesRes.data) {
    responsesRes.data.forEach((r) => {
      responses[r.question_key] = r.answer_value;
    });
  }

  const notes: Record<
    string,
    { text: string; tags: string[]; sentiment: string | null }
  > = {};
  if (notesRes.data) {
    notesRes.data.forEach((n) => {
      notes[n.section_key] = {
        text: n.note_text,
        tags: n.tagged_questions || [],
        sentiment: n.sentiment_hint,
      };
    });
  }

  return (
    <ReviewContent
      session={session}
      responses={responses}
      notes={notes}
      isOwner={session.created_by === user.id}
    />
  );
}
