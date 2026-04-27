"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface SessionsContentProps {
  user: User;
}

export function SessionsContent({ user }: SessionsContentProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Đã đăng xuất");
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="border-b border-[var(--gray-m)] bg-white">
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
              {user.user_metadata?.full_name || user.email}
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

      <main className="max-w-7xl mx-auto px-6 py-10">
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
            disabled
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Phiên mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-[var(--gray-m)] shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-[var(--muted)]">
                Tổng phiên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[32px] font-serif text-[var(--purple)]">0</div>
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
            </CardContent>
          </Card>

          <Card className="border-[var(--gray-m)] shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-medium text-[var(--muted)]">
                Bản nháp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[32px] font-serif text-[var(--amber)]">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Empty state with skeleton placeholders */}
        <Card className="border-[var(--gray-m)] shadow-card">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--gray-l)] flex items-center justify-center mx-auto mb-4">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className="font-serif text-[18px] text-[var(--text)] mb-2">
                Chưa có phiên interview nào
              </h3>
              <p className="text-[13px] text-[var(--muted)] max-w-[360px] mx-auto">
                Tạo phiên mới để bắt đầu thu thập dữ liệu user research.
                Tính năng này sẽ được bật trong Phase 4.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton loader example for future data loading */}
        <div className="mt-6 space-y-3 hidden">
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
      </main>
    </>
  );
}
