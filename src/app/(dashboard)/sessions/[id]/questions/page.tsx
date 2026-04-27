import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InterviewEngine } from "@/components/interview/InterviewEngine";
import type { Json } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

const RESPONDENT_TYPE_MAP: Record<string, string> = {
  learner: "learner",
  teacher: "teacher",
  parent: "parent",
  counselor: "counselor",
  cultural_official: "cultural_official",
};

export default async function QuestionsPage({ params }: PageProps) {
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

  const respondentType =
    RESPONDENT_TYPE_MAP[session.respondent_type] || "learner";

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

  const initialResponses: Record<string, Json> = {};
  if (responsesRes.data) {
    responsesRes.data.forEach((r) => {
      initialResponses[r.question_key] = r.answer_value;
    });
  }

  const initialNotes: Record<
    string,
    { text: string; tags: string[]; sentiment: string | null }
  > = {};
  if (notesRes.data) {
    notesRes.data.forEach((n) => {
      initialNotes[n.section_key] = {
        text: n.note_text,
        tags: n.tagged_questions || [],
        sentiment: n.sentiment_hint,
      };
    });
  }

  return (
    <InterviewEngine
      sessionId={sessionId}
      respondentType={respondentType}
      initialResponses={initialResponses}
      initialNotes={initialNotes}
    />
  );
}
