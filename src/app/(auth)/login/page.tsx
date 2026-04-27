"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Check user role and status for redirect
    if (data.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role, status")
        .eq("id", data.user.id)
        .single();

      if (profile?.status === "pending") {
        toast.error("Tài khoản đang chờ duyệt. Vui lòng liên hệ admin.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (profile?.status === "suspended") {
        toast.error("Tài khoản đã bị tạm ngưng.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      toast.success("Đăng nhập thành công!");

      // Role-based redirect: admin → /admin, user → /sessions
      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/sessions");
      }
    } else {
      router.push("/sessions");
    }

    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="font-serif text-[28px] text-[var(--text)] leading-tight">
            Interview Form
            <br />
            LMS Tiếng Đức
          </h1>
          <p className="font-mono text-[11px] text-[var(--muted)] mt-1 uppercase tracking-[0.06em]">
            User Research · v1.2
          </p>
        </div>

        <Card className="border-[var(--gray-m)] shadow-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="font-serif text-[22px]">Đăng nhập</CardTitle>
            <CardDescription className="text-[13px] text-[var(--muted)]">
              Nhập email và mật khẩu để truy cập hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 text-[13px] border-[var(--gray-m)] focus:border-[var(--purple)] focus:ring-[var(--purple)]/10"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[13px] font-medium">
                    Mật khẩu
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-[12px] text-[var(--purple)] hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 text-[13px] border-[var(--gray-m)] focus:border-[var(--purple)] focus:ring-[var(--purple)]/10"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[14px] font-medium rounded-lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-[13px] text-[var(--muted)]">
                Chưa có tài khoản?{" "}
                <Link
                  href="/register"
                  className="text-[var(--purple)] font-medium hover:underline"
                >
                  Đăng ký
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
