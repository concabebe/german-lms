"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Ban,
  Trash2,
  KeyRound,
  UserPlus,
  Users,
  ChevronDown,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type User = Database["public"]["Tables"]["users"]["Row"] & {
  session_count?: number;
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#FAEEDA", color: "#854F0B", label: "Chờ duyệt" },
  active: { bg: "#E1F5EE", color: "#0F6E56", label: "Hoạt động" },
  suspended: { bg: "#FAECE7", color: "#993C1D", label: "Đình chỉ" },
};

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  admin: { bg: "#EEEDFE", color: "#534AB7", label: "Admin" },
  user: { bg: "#F5F4F0", color: "#6B6560", label: "User" },
};

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: usersData } = await supabase
      .from("users")
      .select("*")
      .order("status", { ascending: true })
      .order("created_at", { ascending: false });

    if (usersData) {
      const sessionCounts: Record<string, number> = {};
      const { data: sessions } = await supabase
        .from("interview_sessions")
        .select("created_by");

      if (sessions) {
        for (const s of sessions) {
          sessionCounts[s.created_by] = (sessionCounts[s.created_by] || 0) + 1;
        }
      }

      const enriched = usersData.map((u) => ({
        ...u,
        session_count: sessionCounts[u.id] || 0,
      }));

      // Sort: pending first
      enriched.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        return 0;
      });

      setUsers(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (userId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("id", userId);
    if (error) toast.error("Lỗi: " + error.message);
    else { toast.success("Đã duyệt user"); fetchUsers(); }
  };

  const handleSuspend = async (userId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ status: "suspended" })
      .eq("id", userId);
    if (error) toast.error("Lỗi: " + error.message);
    else { toast.success("Đã đình chỉ user"); fetchUsers(); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Xoá user này? Hành động không thể hoàn tác.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) toast.error("Lỗi: " + error.message);
    else { toast.success("Đã xoá user"); fetchUsers(); }
  };

  const handleChangeRole = async (userId: string, newRole: "admin" | "user") => {
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) toast.error("Lỗi: " + error.message);
    else { toast.success(`Đã đổi role → ${newRole}`); fetchUsers(); }
    setRoleDropdown(null);
  };

  const handleBulkApprove = async () => {
    const pending = users.filter((u) => u.status === "pending");
    if (pending.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ status: "active" })
      .eq("status", "pending");
    if (error) toast.error("Lỗi: " + error.message);
    else { toast.success(`Đã duyệt ${pending.length} users`); fetchUsers(); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: inviteEmail.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) toast.error("Lỗi gửi link: " + error.message);
    else {
      toast.success("Đã gửi magic link đến " + inviteEmail);
      setInviteEmail("");
      setShowInvite(false);
    }
    setInviting(false);
  };

  const pendingCount = users.filter((u) => u.status === "pending").length;

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
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
            <Users className="h-4 w-4" />
            {users.length} users
          </div>
          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={handleBulkApprove}
              className="bg-[var(--teal)] hover:bg-[#0B5A46] text-white text-[12px]"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Duyệt tất cả ({pendingCount})
            </Button>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setShowInvite(!showInvite)}
          className="bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[12px]"
        >
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Mời user
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-4 mb-4 flex gap-3">
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            className="text-[13px] border-[var(--gray-m)] flex-1"
          />
          <Button
            size="sm"
            onClick={handleInvite}
            disabled={inviting}
            className="bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[12px]"
          >
            {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Gửi magic link"}
          </Button>
        </div>
      )}

      {/* Users table */}
      <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--gray-m)] bg-[var(--gray-l)]">
              <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Name</th>
              <th className="text-left px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Email</th>
              <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Role</th>
              <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Status</th>
              <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Sessions</th>
              <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Last Active</th>
              <th className="text-right px-4 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const status = STATUS_STYLES[user.status] || STATUS_STYLES.pending;
              const role = ROLE_STYLES[user.role] || ROLE_STYLES.user;
              const isPending = user.status === "pending";

              return (
                <tr
                  key={user.id}
                  className={`border-b border-[var(--gray-l)] hover:bg-[var(--gray-l)]/50 ${
                    isPending ? "bg-[#FAEEDA]/20" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--purple-l)] flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-medium text-[var(--purple)]">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[13px] font-medium text-[var(--text)]">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-[var(--muted)]">{user.email}</td>
                  <td className="text-center px-3 py-3 relative">
                    <button
                      type="button"
                      onClick={() => setRoleDropdown(roleDropdown === user.id ? null : user.id)}
                      className="inline-flex items-center gap-1"
                    >
                      <span
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full"
                        style={{ background: role.bg, color: role.color }}
                      >
                        {role.label}
                      </span>
                      <ChevronDown className="h-3 w-3 text-[var(--muted)]" />
                    </button>
                    {roleDropdown === user.id && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 z-10 bg-[var(--white)] border border-[var(--gray-m)] rounded-lg shadow-lg py-1 min-w-[100px]">
                        <button
                          type="button"
                          onClick={() => handleChangeRole(user.id, "admin")}
                          className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[var(--gray-l)] text-[var(--text)]"
                        >
                          Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeRole(user.id, "user")}
                          className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[var(--gray-l)] text-[var(--text)]"
                        >
                          User
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="text-center px-3 py-3">
                    <span
                      className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3 text-[12px] font-mono text-[var(--muted)]">
                    {user.session_count}
                  </td>
                  <td className="text-center px-3 py-3 text-[11px] text-[var(--muted)]">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td className="text-right px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleApprove(user.id)}
                          className="p-1.5 rounded-md hover:bg-[#E1F5EE] text-[#0F6E56] transition-colors"
                          title="Duyệt"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {user.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handleSuspend(user.id)}
                          className="p-1.5 rounded-md hover:bg-[#FAECE7] text-[#993C1D] transition-colors"
                          title="Đình chỉ"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {user.status === "suspended" && (
                        <button
                          type="button"
                          onClick={() => handleApprove(user.id)}
                          className="p-1.5 rounded-md hover:bg-[#E1F5EE] text-[#0F6E56] transition-colors"
                          title="Kích hoạt lại"
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          toast.info("Reset password: dùng Supabase Dashboard → Auth → Users");
                        }}
                        className="p-1.5 rounded-md hover:bg-[var(--gray-l)] text-[var(--muted)] transition-colors"
                        title="Reset password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 rounded-md hover:bg-[#FAECE7] text-[#993C1D] transition-colors"
                        title="Xoá"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[13px] text-[var(--muted)]">Chưa có user nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
