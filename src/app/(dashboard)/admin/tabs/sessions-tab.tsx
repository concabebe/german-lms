"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  Eye,
  X,
  MessageSquare,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "sonner";
import type { Database, Json } from "@/types/database";
import { QUESTIONS, SECTIONS } from "@/lib/questions/data";
import { GROUP_DEFS, RESPONDENT_TYPE_TO_GROUPS } from "@/lib/questions/types";
import type { GroupKey } from "@/lib/questions/types";

type Session = Database["public"]["Tables"]["interview_sessions"]["Row"];

const RESPONDENT_LABELS: Record<string, string> = {
  learner: "LRN",
  teacher: "TCH",
  parent: "PAR",
  counselor: "CNS",
  cultural_official: "CLT",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "#FAEEDA", color: "#854F0B", label: "Bản nháp" },
  completed: { bg: "#E1F5EE", color: "#0F6E56", label: "Hoàn thành" },
  archived: { bg: "#F5F4F0", color: "#6B6560", label: "Lưu trữ" },
};

const SENTIMENT_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  positive: { bg: "#E1F5EE", color: "#0F6E56", label: "Tích cực" },
  negative: { bg: "#FAECE7", color: "#993C1D", label: "Tiêu cực" },
  neutral: { bg: "#E6F1FB", color: "#185FA5", label: "Trung lập" },
  uncertain: { bg: "#FAEEDA", color: "#854F0B", label: "Không chắc" },
};

export function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalSession, setModalSession] = useState<Session | null>(null);
  const [modalTab, setModalTab] = useState<"answers" | "notes">("answers");
  const [modalResponses, setModalResponses] = useState<Record<string, Json>>({});
  const [modalNotes, setModalNotes] = useState<
    { id: string; section_key: string; note_text: string; sentiment_hint: string | null; is_notable: boolean }[]
  >([]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("interview_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("session_status", statusFilter as "draft" | "completed" | "archived");
    }
    if (typeFilter !== "all") {
      query = query.eq("respondent_type", typeFilter as string);
    }

    const { data } = await query;
    setSessions(data || []);
    setLoading(false);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openModal = async (session: Session) => {
    setModalSession(session);
    setModalTab("answers");
    const supabase = createClient();

    const [responsesRes, notesRes] = await Promise.all([
      supabase
        .from("responses")
        .select("question_key, answer_value")
        .eq("session_id", session.id),
      supabase
        .from("session_notes")
        .select("id, section_key, note_text, sentiment_hint, is_notable")
        .eq("session_id", session.id),
    ]);

    const responses: Record<string, Json> = {};
    if (responsesRes.data) {
      for (const r of responsesRes.data) {
        responses[r.question_key] = r.answer_value;
      }
    }
    setModalResponses(responses);
    setModalNotes(notesRes.data || []);
  };

  const toggleNotable = async (noteId: string, current: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("session_notes")
      .update({ is_notable: !current })
      .eq("id", noteId);
    if (error) toast.error("Lỗi: " + error.message);
    else {
      setModalNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, is_notable: !current } : n))
      );
      toast.success(!current ? "Đã đánh dấu notable" : "Đã bỏ đánh dấu");
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  };

  const exportCSV = () => {
    const selected = sessions.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) {
      toast.error("Chọn ít nhất 1 phiên để xuất");
      return;
    }

    const headers = [
      "ID",
      "Respondent Name",
      "Type",
      "Gender",
      "Birth Year",
      "Location",
      "Occupation",
      "Phone",
      "Status",
      "Created At",
      "Completed At",
      "Session Note",
    ];
    const rows = selected.map((s) => [
      s.id,
      s.respondent_full_name,
      s.respondent_type,
      s.respondent_gender,
      s.respondent_birth_year,
      s.respondent_location,
      s.respondent_occupation || "",
      s.respondent_phone || "",
      s.session_status,
      s.created_at,
      s.completed_at || "",
      (s.session_note || "").replace(/"/g, '""'),
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sessions-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${selected.length} phiên`);
  };

  const [exporting, setExporting] = useState(false);

  const exportAllSessions = async () => {
    setExporting(true);
    try {
      const supabase = createClient();

      const { data: allSessions, error: sessionsError } = await supabase
        .from("interview_sessions")
        .select("*")
        .order("created_at", { ascending: true });

      if (sessionsError || !allSessions?.length) {
        toast.error(allSessions?.length === 0 ? "Không có phiên nào để xuất" : "Lỗi tải dữ liệu phiên");
        setExporting(false);
        return;
      }

      const sessionIds = allSessions.map((s) => s.id);
      const { data: allResponses, error: responsesError } = await supabase
        .from("responses")
        .select("session_id, question_key, answer_value")
        .in("session_id", sessionIds);

      if (responsesError) {
        toast.error("Lỗi tải câu trả lời");
        setExporting(false);
        return;
      }

      const responseMap = new Map<string, Map<string, Json>>();
      (allResponses || []).forEach((r) => {
        if (!responseMap.has(r.session_id)) {
          responseMap.set(r.session_id, new Map());
        }
        responseMap.get(r.session_id)!.set(r.question_key, r.answer_value);
      });

      const allQuestionKeys: string[] = [];
      const questionLabels: Record<string, string> = {};
      Object.keys(QUESTIONS).forEach((key) => {
        allQuestionKeys.push(key);
        const q = QUESTIONS[key];
        questionLabels[key] = `[${key}] ${q.text.slice(0, 80)}`;
      });

      const metaHeaders = [
        "STT",
        "Session ID",
        "Trạng thái",
        "Loại respondent",
        "Họ tên",
        "Năm sinh",
        "Giới tính",
        "Địa điểm",
        "Nghề nghiệp",
        "Số điện thoại",
        "Ghi chú phiên",
        "Ngày tạo",
        "Ngày hoàn thành",
      ];
      const headers = [...metaHeaders, ...allQuestionKeys.map((k) => questionLabels[k])];

      const csvEscape = (val: string) => `"${val.replace(/"/g, '""').replace(/\n/g, " ")}"`;

      const rows = allSessions.map((s, idx) => {
        const sessionResponses = responseMap.get(s.id) || new Map();
        const meta = [
          String(idx + 1),
          s.id,
          s.session_status,
          s.respondent_type,
          s.respondent_full_name,
          String(s.respondent_birth_year),
          s.respondent_gender,
          s.respondent_location,
          s.respondent_occupation || "",
          s.respondent_phone || "",
          (s.session_note || "").replace(/\n/g, " "),
          new Date(s.created_at).toLocaleDateString("vi-VN"),
          s.completed_at ? new Date(s.completed_at).toLocaleDateString("vi-VN") : "",
        ];
        const answers = allQuestionKeys.map((key) => {
          const val = sessionResponses.get(key);
          return formatAnswer(val as Json);
        });
        return [...meta, ...answers].map(csvEscape).join(",");
      });

      const bom = "\uFEFF";
      const csv = bom + headers.map(csvEscape).join(",") + "\n" + rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-sessions-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất toàn bộ ${allSessions.length} phiên`);
    } catch {
      toast.error("Lỗi xuất dữ liệu");
    }
    setExporting(false);
  };

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

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--gray-m)] rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--gray-l)]"
            >
              Status: {statusFilter === "all" ? "Tất cả" : STATUS_STYLES[statusFilter]?.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 z-10 bg-[var(--white)] border border-[var(--gray-m)] rounded-lg shadow-lg py-1 min-w-[120px]">
                {["all", "draft", "completed", "archived"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); }}
                    className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[var(--gray-l)] text-[var(--text)]"
                  >
                    {s === "all" ? "Tất cả" : STATUS_STYLES[s]?.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--gray-m)] rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--gray-l)]"
            >
              Type: {typeFilter === "all" ? "Tất cả" : RESPONDENT_LABELS[typeFilter]}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showTypeDropdown && (
              <div className="absolute top-full left-0 mt-1 z-10 bg-[var(--white)] border border-[var(--gray-m)] rounded-lg shadow-lg py-1 min-w-[140px]">
                {["all", "learner", "teacher", "parent", "counselor", "cultural_official"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTypeFilter(t); setShowTypeDropdown(false); }}
                    className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[var(--gray-l)] text-[var(--text)]"
                  >
                    {t === "all" ? "Tất cả" : RESPONDENT_LABELS[t] || t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportAllSessions}
            disabled={exporting}
            className="text-[12px] border-[var(--purple)] text-[var(--purple)] hover:bg-[var(--purple-l)]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
            {exporting ? "Đang xuất..." : "Xuất toàn bộ"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            disabled={selectedIds.size === 0}
            className="text-[12px] border-[var(--gray-m)] text-[var(--muted)]"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV ({selectedIds.size})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--gray-m)] bg-[var(--gray-l)]">
              <th className="px-3 py-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.size === sessions.length && sessions.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-[var(--gray-m)]"
                />
              </th>
              <th className="text-left px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Respondent</th>
              <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Type</th>
              <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Status</th>
              <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Interviewer</th>
              <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Date</th>
              <th className="text-right px-4 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const status = STATUS_STYLES[session.session_status] || STATUS_STYLES.draft;
              return (
                <tr key={session.id} className="border-b border-[var(--gray-l)] hover:bg-[var(--gray-l)]/50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(session.id)}
                      onChange={() => toggleSelect(session.id)}
                      className="rounded border-[var(--gray-m)]"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-[13px] font-medium text-[var(--text)]">{session.respondent_full_name}</p>
                    <p className="text-[11px] text-[var(--muted)]">{session.respondent_location}</p>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--gray-l)] text-[var(--muted)]">
                      {RESPONDENT_LABELS[session.respondent_type] || session.respondent_type}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span
                      className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3 text-[11px] font-mono text-[var(--muted)]">
                    {session.created_by.slice(0, 8)}...
                  </td>
                  <td className="text-center px-3 py-3 text-[11px] text-[var(--muted)]">
                    {new Date(session.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="text-right px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openModal(session)}
                      className="p-1.5 rounded-md hover:bg-[var(--purple-l)] text-[var(--purple)] transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[13px] text-[var(--muted)]">Không có phiên nào</p>
          </div>
        )}
      </div>

      {/* Session detail modal */}
      {modalSession && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--white)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--gray-m)]">
              <div>
                <h3 className="font-serif text-[18px] text-[var(--text)]">
                  {modalSession.respondent_full_name}
                </h3>
                <p className="text-[12px] text-[var(--muted)]">
                  {modalSession.respondent_type} · {modalSession.respondent_location} · {modalSession.respondent_gender}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalSession(null)}
                className="p-2 rounded-lg hover:bg-[var(--gray-l)] text-[var(--muted)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal tabs */}
            <div className="flex gap-1 px-6 border-b border-[var(--gray-m)]">
              <button
                type="button"
                onClick={() => setModalTab("answers")}
                className={`px-3 py-2 text-[12px] font-medium relative ${
                  modalTab === "answers" ? "text-[var(--purple)]" : "text-[var(--muted)]"
                }`}
              >
                Respondent Info + Answers
                {modalTab === "answers" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--purple)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalTab("notes")}
                className={`px-3 py-2 text-[12px] font-medium relative ${
                  modalTab === "notes" ? "text-[var(--purple)]" : "text-[var(--muted)]"
                }`}
              >
                Notes ({modalNotes.length})
                {modalTab === "notes" && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--purple)]" />
                )}
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-auto px-6 py-4">
              {modalTab === "answers" && (
                <ModalAnswersTab session={modalSession} responses={modalResponses} formatAnswer={formatAnswer} />
              )}
              {modalTab === "notes" && (
                <ModalNotesTab notes={modalNotes} toggleNotable={toggleNotable} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalAnswersTab({
  session,
  responses,
  formatAnswer,
}: {
  session: Session;
  responses: Record<string, Json>;
  formatAnswer: (v: Json) => string;
}) {
  const groupKeys =
    RESPONDENT_TYPE_TO_GROUPS[session.respondent_type] ||
    (["lrn"] as GroupKey[]);
  const groups = GROUP_DEFS.filter((g) => groupKeys.includes(g.key));

  return (
    <div className="space-y-6">
      {/* Respondent info */}
      <div className="grid grid-cols-2 gap-3">
        <InfoField label="Họ tên" value={session.respondent_full_name} />
        <InfoField label="Nhóm" value={session.respondent_type} />
        <InfoField label="Năm sinh" value={String(session.respondent_birth_year)} />
        <InfoField label="Giới tính" value={session.respondent_gender} />
        <InfoField label="Địa điểm" value={session.respondent_location} />
        <InfoField label="Nghề nghiệp" value={session.respondent_occupation || "—"} />
      </div>

      {/* All answers */}
      {groups.map((group) => {
        const groupSections = SECTIONS[group.key] || {};
        return (
          <div key={group.key}>
            <h4 className="font-serif text-[15px] mb-3" style={{ color: group.dotColor }}>
              {group.label}
            </h4>
            {Object.entries(groupSections).map(([secKey, section]) => (
              <div key={secKey} className="mb-3">
                <p className="text-[12px] font-medium text-[var(--text)] mb-2">{section.title}</p>
                {section.keys.map((qKey) => {
                  const q = QUESTIONS[qKey];
                  if (!q) return null;
                  const val = responses[qKey];
                  const hasAnswer = val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
                  return (
                    <div key={qKey} className="flex items-start gap-2 py-1 border-b border-[var(--gray-l)] last:border-b-0">
                      <span className="text-[9px] font-mono text-[var(--muted)] bg-[var(--gray-l)] px-1 py-0.5 rounded shrink-0 mt-0.5">
                        {qKey}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[var(--muted)]">{q.text}</p>
                        <p className={`text-[12px] ${hasAnswer ? "text-[var(--text)]" : "text-[var(--muted)] italic"}`}>
                          {hasAnswer ? formatAnswer(val) : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ModalNotesTab({
  notes,
  toggleNotable,
}: {
  notes: { id: string; section_key: string; note_text: string; sentiment_hint: string | null; is_notable: boolean }[];
  toggleNotable: (id: string, current: boolean) => void;
}) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-[var(--muted)]">Không có ghi chú nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const sentiment = note.sentiment_hint ? SENTIMENT_STYLES[note.sentiment_hint] : null;
        return (
          <div
            key={note.id}
            className={`border rounded-lg p-4 ${
              note.is_notable ? "border-[#EF9F27] bg-[#FAEEDA]/20" : "border-[var(--gray-m)]"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-[var(--muted)]" />
                <span className="text-[11px] font-mono font-medium text-[var(--purple)]">
                  {note.section_key}
                </span>
                {sentiment && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                    style={{ background: sentiment.bg, color: sentiment.color }}
                  >
                    {sentiment.label}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleNotable(note.id, note.is_notable)}
                className={`p-1.5 rounded-md transition-colors ${
                  note.is_notable
                    ? "text-[#EF9F27] hover:bg-[#FAEEDA]"
                    : "text-[var(--muted)] hover:bg-[var(--gray-l)]"
                }`}
                title={note.is_notable ? "Bỏ đánh dấu notable" : "Đánh dấu notable"}
              >
                {note.is_notable ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[12px] text-[var(--text)] leading-relaxed">{note.note_text}</p>
          </div>
        );
      })}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </span>
      <p className="text-[12px] text-[var(--text)] mt-0.5">{value}</p>
    </div>
  );
}
