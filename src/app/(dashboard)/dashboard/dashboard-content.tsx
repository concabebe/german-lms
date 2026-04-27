"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface DashboardContentProps {
  user: User;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Đã đăng xuất");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--gray-m)] bg-[var(--white)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[20px] text-[var(--text)]">
              Interview Form — LMS Tiếng Đức
            </h1>
            <p className="font-mono text-[11px] text-[var(--muted)] uppercase tracking-[0.06em]">
              User Research · v1.2
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[var(--muted)]">
              {user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-[13px] border-[var(--gray-m)] text-[var(--muted)] hover:text-[var(--text)]"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-10">
        <div className="mb-8">
          <h2 className="font-serif text-[28px] text-[var(--text)] mb-2">
            Xin chào, {user.user_metadata?.full_name || user.email}
          </h2>
          <p className="text-[13px] text-[var(--muted)]">
            Chào mừng bạn đến với hệ thống User Research — LMS Tiếng Đức
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-[var(--gray-m)] shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-[var(--muted)]">
                Phiên interview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[32px] font-serif text-[var(--purple)]">0</div>
              <p className="text-[12px] text-[var(--muted)] mt-1">Tổng số phiên</p>
            </CardContent>
          </Card>

          <Card className="border-[var(--gray-m)] shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-[var(--muted)]">
                Hoàn thành
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[32px] font-serif text-[var(--teal)]">0</div>
              <p className="text-[12px] text-[var(--muted)] mt-1">Phiên đã hoàn thành</p>
            </CardContent>
          </Card>

          <Card className="border-[var(--gray-m)] shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-[var(--muted)]">
                Đang tiến hành
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[32px] font-serif text-[var(--amber)]">0</div>
              <p className="text-[12px] text-[var(--muted)] mt-1">Phiên chưa hoàn thành</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
