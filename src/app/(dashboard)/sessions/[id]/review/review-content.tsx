"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/types/database";
import type { Database } from "@/types/database";
import { QUESTIONS, SECTIONS } from "@/lib/questions/data";
import {
  GROUP_DEFS,
  RESPONDENT_TYPE_TO_GROUPS,
} from "@/lib/questions/types";
import type { GroupKey } from "@/lib/questions/types";

type Session = Database["public"]["Tables"]["interview_sessions"]["Row"];

const RESPONDENT_LABELS: Record<string, string> = {
  learner: "Người học (Learner)",
  teacher: "Giáo viên (Teacher)",
  parent: "Phụ huynh (Parent)",
  counselor: "Tư vấn viên (Counselor)",
  cultural_official: "Cán bộ văn hoá (Cultural Official)",
};

const GENDER_LABELS: Record<string, string> = {
  Nam: "Nam",
  "Nữ": "Nữ",
  "Khác": "Khác",
};

const SENTIMENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: "Tích cực", color: "#0F6E56", bg: "#E1F5EE" },
  negative: { label: "Tiêu cực", color: "#993C1D", bg: "#FAECE7" },
  neutral: { label: "Trung lập", color: "#185FA5", bg: "#E6F1FB" },
  uncertain: { label: "Không chắc", color: "#854F0B", bg: "#FAEEDA" },
};

interface ReviewContentProps {
  session: Session;
  responses: Record<string, Json>;
  notes: Record<string, { text: string; tags: string[]; sentiment: string | null }>;
  isOwner: boolean;
}

export function ReviewContent({
  session,
  responses,
  notes,
  isOwner,
}: ReviewContentProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [sessionNote, setSessionNote] = useState(session.session_note || "");
  const [noteCharCount, setNoteCharCount] = useState(
    (session.session_note || "").length
  );

  const groupKeys =
    RESPONDENT_TYPE_TO_GROUPS[session.respondent_type] ||
    (["lrn"] as GroupKey[]);
  const groups = GROUP_DEFS.filter((g) => groupKeys.includes(g.key));

  const totalQuestions = groups.reduce((sum, g) => {
    const groupSections = SECTIONS[g.key] || {};
    return (
      sum +
      Object.values(groupSections).reduce(
        (s, sec) => s + sec.keys.length,
        0
      )
    );
  }, 0);

  const answeredQuestions = groups.reduce((sum, g) => {
    const groupSections = SECTIONS[g.key] || {};
    return (
      sum +
      Object.values(groupSections).reduce(
        (s, sec) =>
          s +
          sec.keys.filter((k) => {
            const val = responses[k];
            if (val === undefined || val === null || val === "") return false;
            if (Array.isArray(val) && val.length === 0) return false;
            return true;
          }).length,
        0
      )
    );
  }, 0);

  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const formatAnswer = (value: Json): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object" && "value" in value) {
      const obj = value as { value: Json; other_text?: string };
      const mainVal = Array.isArray(obj.value) ? obj.value.join(", ") : String(obj.value);
      if (obj.other_text) return `${mainVal} — ${obj.other_text}`;
      return mainVal;
    }
    return JSON.stringify(value);
  };

  const handleComplete = async () => {
    if (
      !confirm(
        "Bạn có chắc muốn hoàn thành phiên này? Sau khi hoàn thành, bạn không thể chỉnh sửa câu trả lời."
      )
    )
      return;

    setSubmitting(true);
    const supabase = createClient();

    if (sessionNote.trim() !== (session.session_note || "").trim()) {
      await supabase
        .from("interview_sessions")
        .update({ session_note: sessionNote.trim() })
        .eq("id", session.id);
    }

    const { error } = await supabase
      .from("interview_sessions")
      .update({
        session_status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (error) {
      toast.error("Không thể hoàn thành phiên: " + error.message);
      setSubmitting(false);
      return;
    }

    toast.success("Phiên đã hoàn thành!");
    router.push("/sessions");
    router.refresh();
  };

  const handleSaveNote = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("interview_sessions")
      .update({ session_note: sessionNote.trim() })
      .eq("id", session.id);
    if (error) {
      toast.error("Lỗi lưu ghi chú");
    } else {
      toast.success("Đã lưu ghi chú phiên");
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-10">
      {/* Header */}
      <button
        type="button"
        onClick={() => router.push("/sessions")}
        className="flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại danh sách
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-serif text-[28px] text-[var(--text)] mb-1">
            Tổng kết phiên interview
          </h2>
          <p className="text-[13px] text-[var(--muted)]">
            Kiểm tra lại câu trả lời trước khi hoàn thành phiên.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
              session.session_status === "completed"
                ? "bg-[#E1F5EE] text-[#0F6E56]"
                : session.session_status === "draft"
                  ? "bg-[#FAEEDA] text-[#854F0B]"
                  : "bg-[#F5F4F0] text-[#6B6560]"
            }`}
          >
            {session.session_status === "completed"
              ? "Hoàn thành"
              : session.session_status === "draft"
                ? "Bản nháp"
                : "Lưu trữ"}
          </span>
        </div>
      </div>

      {/* Respondent info card */}
      <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-5 mb-6">
        <h3 className="font-serif text-[16px] text-[var(--text)] mb-4">
          Thông tin respondent
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono">
              Họ tên
            </span>
            <p className="text-[13px] text-[var(--text)] mt-0.5">
              {session.respondent_full_name}
            </p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono">
              Nhóm
            </span>
            <p className="text-[13px] text-[var(--text)] mt-0.5">
              {RESPONDENT_LABELS[session.respondent_type] ||
                session.respondent_type}
            </p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono">
              Năm sinh
            </span>
            <p className="text-[13px] text-[var(--text)] mt-0.5">
              {session.respondent_birth_year}
            </p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono">
              Giới tính
            </span>
            <p className="text-[13px] text-[var(--text)] mt-0.5">
              {GENDER_LABELS[session.respondent_gender] ||
                session.respondent_gender}
            </p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono">
              Địa điểm
            </span>
            <p className="text-[13px] text-[var(--text)] mt-0.5">
              {session.respondent_location}
            </p>
          </div>
          {session.respondent_occupation && (
            <div>
              <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono">
                Nghề nghiệp
              </span>
              <p className="text-[13px] text-[var(--text)] mt-0.5">
                {session.respondent_occupation}
              </p>
            </div>
          )}
          {session.respondent_phone && (
            <div>
              <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono">
                Điện thoại
              </span>
              <p className="text-[13px] text-[var(--text)] mt-0.5">
                {session.respondent_phone}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-[16px] text-[var(--text)]">
            Tiến độ
          </h3>
          <span className="text-[13px] text-[var(--muted)] font-mono">
            {answeredQuestions} / {totalQuestions} câu ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-[var(--gray-l)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              backgroundColor:
                progressPercent >= 100
                  ? "var(--teal)"
                  : progressPercent >= 50
                    ? "var(--purple)"
                    : "var(--amber)",
            }}
          />
        </div>
      </div>

      {/* Answers by group/section */}
      {groups.map((group) => {
        const groupSections = SECTIONS[group.key] || {};
        return (
          <div key={group.key} className="mb-8">
            <h3
              className="font-serif text-[18px] mb-4"
              style={{ color: group.dotColor }}
            >
              {group.label}
            </h3>

            {Object.entries(groupSections).map(([secKey, section]) => {
              const noteData = notes[secKey];
              return (
                <div
                  key={secKey}
                  className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-5 mb-4"
                >
                  <h4 className="text-[14px] font-semibold text-[var(--text)] mb-3">
                    {section.title}
                  </h4>

                  <div className="space-y-3">
                    {section.keys.map((qKey) => {
                      const question = QUESTIONS[qKey];
                      if (!question) return null;
                      const answer = responses[qKey];
                      const hasAnswer =
                        answer !== undefined &&
                        answer !== null &&
                        answer !== "" &&
                        !(Array.isArray(answer) && answer.length === 0);

                      return (
                        <div
                          key={qKey}
                          className="flex items-start gap-3 py-2 border-b border-[var(--gray-l)] last:border-b-0"
                        >
                          <span
                            className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md shrink-0 mt-0.5"
                            style={{
                              background: section.bg,
                              color: section.color,
                            }}
                          >
                            {qKey}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-[var(--muted)] mb-0.5">
                              {question.text}
                            </p>
                            <p
                              className={`text-[13px] ${
                                hasAnswer
                                  ? "text-[var(--text)]"
                                  : "text-[var(--muted)] italic"
                              }`}
                            >
                              {hasAnswer ? formatAnswer(answer) : "Chưa trả lời"}
                            </p>
                          </div>
                          {hasAnswer && (
                            <CheckCircle2 className="h-4 w-4 text-[var(--teal)] shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Section note */}
                  {noteData && noteData.text && (
                    <div className="mt-4 bg-[#FAEEDA] rounded-lg p-3 border-l-[3px] border-[#EF9F27]">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-[#854F0B] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[12px] text-[#854F0B]">
                            {noteData.text}
                          </p>
                          {noteData.sentiment && (
                            <span
                              className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded-md mt-2"
                              style={{
                                background:
                                  SENTIMENT_LABELS[noteData.sentiment]?.bg || "#F5F4F0",
                                color:
                                  SENTIMENT_LABELS[noteData.sentiment]?.color || "#6B6560",
                              }}
                            >
                              {SENTIMENT_LABELS[noteData.sentiment]?.label ||
                                noteData.sentiment}
                            </span>
                          )}
                          {noteData.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {noteData.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--white)]/60 rounded-md text-[#854F0B]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* General session note */}
      <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-5 mb-6">
        <h3 className="font-serif text-[16px] text-[var(--text)] mb-3">
          Ghi chú chung
        </h3>
        <p className="text-[12px] text-[var(--muted)] mb-3">
          Ghi chú tổng quát về phiên phỏng vấn (nhận xét, quan sát, đề xuất).
        </p>
        {session.session_status === "draft" && isOwner ? (
          <>
            <textarea
              value={sessionNote}
              onChange={(e) => {
                setSessionNote(e.target.value);
                setNoteCharCount(e.target.value.length);
              }}
              onBlur={handleSaveNote}
              placeholder="Nhập ghi chú chung về phiên phỏng vấn..."
              className="w-full border border-[var(--gray-m)] rounded-lg p-3 font-sans text-[13px] text-[var(--text)] bg-[var(--white)] resize-y min-h-[100px] outline-none focus:border-[var(--purple)] focus:shadow-[0_0_0_3px_rgba(83,74,183,0.08)] transition-colors"
            />
            <div className="text-right text-[11px] text-[var(--muted)] font-mono mt-1">
              {noteCharCount} / 2000
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[var(--text)]">
            {session.session_note || (
              <span className="text-[var(--muted)] italic">
                Không có ghi chú
              </span>
            )}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--gray-m)]">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/sessions")}
            className="text-[13px] border-[var(--gray-m)] text-[var(--muted)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Danh sách
          </Button>
          {session.session_status === "draft" && isOwner && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/sessions/${session.id}/questions`)
              }
              className="text-[13px] border-[var(--gray-m)] text-[var(--purple)]"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Chỉnh sửa câu trả lời
            </Button>
          )}
        </div>
        {session.session_status === "draft" && isOwner && (
          <Button
            onClick={handleComplete}
            disabled={submitting}
            className="bg-[var(--teal)] hover:bg-[#0B5A46] text-white text-[13px] font-medium"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
            )}
            {submitting ? "Đang hoàn thành..." : "Hoàn thành phiên"}
          </Button>
        )}
      </div>
    </main>
  );
}
