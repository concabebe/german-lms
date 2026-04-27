"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  FileText,
  Eye,
  Archive,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type Session = Database["public"]["Tables"]["interview_sessions"]["Row"];

interface SessionsContentProps {
  isAdmin?: boolean;
}

const RESPONDENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  learner: { label: "LRN", color: "#0F6E56", bg: "#E1F5EE" },
  teacher: { label: "TCH", color: "#0F6E56", bg: "#E1F5EE" },
  parent: { label: "PAR", color: "#993C1D", bg: "#FAECE7" },
  counselor: { label: "CNS", color: "#185FA5", bg: "#E6F1FB" },
  cultural_official: { label: "CLT", color: "#854F0B", bg: "#FAEEDA" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Bản nháp", color: "#854F0B", bg: "#FAEEDA" },
  completed: { label: "Hoàn thành", color: "#0F6E56", bg: "#E1F5EE" },
  archived: { label: "Lưu trữ", color: "#6B6560", bg: "#F5F4F0" },
};

export function SessionsContent({ isAdmin = false }: SessionsContentProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const fetchSessions = useCallback(async () => {
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
    if (searchQuery.trim()) {
      query = query.ilike("respondent_full_name", `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Không thể tải danh sách phiên");
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const totalSessions = sessions.length;
  const completedCount = sessions.filter((s) => s.session_status === "completed").length;
  const draftCount = sessions.filter((s) => s.session_status === "draft").length;

  const handleArchive = async (sessionId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("interview_sessions")
      .update({ session_status: "archived" })
      .eq("id", sessionId);
    if (error) {
      toast.error("Không thể lưu trữ phiên");
    } else {
      toast.success("Đã lưu trữ phiên");
      fetchSessions();
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Bạn chắc chắn muốn xoá phiên này? Dữ liệu sẽ không thể khôi phục.")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("interview_sessions")
      .delete()
      .eq("id", sessionId);
    if (error) {
      toast.error("Không thể xoá phiên");
    } else {
      toast.success("Đã xoá phiên");
      fetchSessions();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-[28px] text-[var(--text)] mb-2">
            Phiên interview
          </h2>
          <p className="text-[13px] text-[var(--muted)]">
            Quản lý các phiên phỏng vấn user research
          </p>
        </div>
        <Button
          className="bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[14px] font-medium"
          onClick={() => router.push("/sessions/new")}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Phiên mới
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-[var(--gray-m)] shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="text-[14px] font-medium text-[var(--muted)] mb-1">Tổng phiên</div>
            <div className="text-[32px] font-serif text-[var(--purple)]">{totalSessions}</div>
          </CardContent>
        </Card>
        <Card className="border-[var(--gray-m)] shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="text-[14px] font-medium text-[var(--muted)] mb-1">Hoàn thành</div>
            <div className="text-[32px] font-serif text-[var(--teal)]">{completedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-[var(--gray-m)] shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="text-[14px] font-medium text-[var(--muted)] mb-1">Bản nháp</div>
            <div className="text-[32px] font-serif text-[var(--amber)]">{draftCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
          <Input
            placeholder="Tìm theo tên respondent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-[var(--gray-m)] text-[13px]"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false); }}
            className="flex items-center gap-2 px-3 py-2 border border-[var(--gray-m)] rounded-lg text-[13px] text-[var(--muted)] hover:bg-[var(--gray-l)] transition-colors"
          >
            Trạng thái: {statusFilter === "all" ? "Tất cả" : STATUS_LABELS[statusFilter]?.label}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--gray-m)] rounded-lg shadow-lg z-10 min-w-[160px]">
              {[
                { value: "all", label: "Tất cả" },
                { value: "draft", label: "Bản nháp" },
                { value: "completed", label: "Hoàn thành" },
                { value: "archived", label: "Lưu trữ" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setStatusFilter(opt.value); setShowStatusDropdown(false); }}
                  className={`block w-full text-left px-4 py-2 text-[13px] hover:bg-[var(--gray-l)] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    statusFilter === opt.value ? "text-[var(--purple)] font-medium" : "text-[var(--text)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false); }}
            className="flex items-center gap-2 px-3 py-2 border border-[var(--gray-m)] rounded-lg text-[13px] text-[var(--muted)] hover:bg-[var(--gray-l)] transition-colors"
          >
            Nhóm: {typeFilter === "all" ? "Tất cả" : RESPONDENT_LABELS[typeFilter]?.label}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {showTypeDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--gray-m)] rounded-lg shadow-lg z-10 min-w-[180px]">
              {[
                { value: "all", label: "Tất cả" },
                { value: "learner", label: "LRN — Người học" },
                { value: "teacher", label: "TCH — Giáo viên" },
                { value: "parent", label: "PAR — Phụ huynh" },
                { value: "counselor", label: "CNS — Tư vấn" },
                { value: "cultural_official", label: "CLT — Lãnh sự" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setTypeFilter(opt.value); setShowTypeDropdown(false); }}
                  className={`block w-full text-left px-4 py-2 text-[13px] hover:bg-[var(--gray-l)] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    typeFilter === opt.value ? "text-[var(--purple)] font-medium" : "text-[var(--text)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sessions table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border border-[var(--gray-m)] rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[300px]" />
              </div>
              <Skeleton className="h-6 w-[80px] rounded-full" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="border-[var(--gray-m)] shadow-card">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--gray-l)] flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-[var(--muted)]" />
              </div>
              <h3 className="font-serif text-[18px] text-[var(--text)] mb-2">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Không tìm thấy phiên nào"
                  : "Chưa có phiên interview nào"}
              </h3>
              <p className="text-[13px] text-[var(--muted)] max-w-[360px] mx-auto mb-4">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm."
                  : "Tạo phiên mới để bắt đầu thu thập dữ liệu user research."}
              </p>
              {!(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
                <Button
                  className="bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[13px]"
                  onClick={() => router.push("/sessions/new")}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Tạo phiên đầu tiên
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-[var(--gray-m)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--gray-l)] border-b border-[var(--gray-m)]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Respondent
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Nhóm
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Trạng thái
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Ngày tạo
                </th>
                {isAdmin && (
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Interviewer
                  </th>
                )}
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const typeInfo = RESPONDENT_LABELS[session.respondent_type] || {
                  label: session.respondent_type,
                  color: "#534AB7",
                  bg: "#EEEDFE",
                };
                const statusInfo = STATUS_LABELS[session.session_status] || {
                  label: session.session_status,
                  color: "#6B6560",
                  bg: "#F5F4F0",
                };

                return (
                  <tr
                    key={session.id}
                    className="border-b border-[var(--gray-m)] last:border-b-0 hover:bg-[var(--gray-l)]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium text-[var(--text)]">
                        {session.respondent_full_name}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {session.respondent_location}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md"
                        style={{ background: typeInfo.bg, color: typeInfo.color }}
                      >
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--muted)] font-mono">
                      {formatDate(session.created_at)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-[12px] text-[var(--muted)]">
                        {session.created_by.slice(0, 8)}…
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {session.session_status === "draft" && (
                          <button
                            type="button"
                            onClick={() => router.push(`/sessions/${session.id}/questions`)}
                            className="p-1.5 rounded-md hover:bg-[var(--purple-l)] text-[var(--purple)] transition-colors"
                            title="Tiếp tục"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => router.push(`/sessions/${session.id}/review`)}
                          className="p-1.5 rounded-md hover:bg-[var(--blue-l)] text-[var(--blue)] transition-colors"
                          title="Xem"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {session.session_status !== "archived" && (
                          <button
                            type="button"
                            onClick={() => handleArchive(session.id)}
                            className="p-1.5 rounded-md hover:bg-[var(--amber-l)] text-[var(--amber)] transition-colors"
                            title="Lưu trữ"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(session.id)}
                          className="p-1.5 rounded-md hover:bg-[var(--coral-l)] text-[var(--coral)] transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
