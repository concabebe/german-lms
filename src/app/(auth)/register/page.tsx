"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setRegistered(true);
    toast.success("Đăng ký thành công!");
    setLoading(false);
  }

  if (registered) {
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
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-[var(--amber-l)] flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="font-serif text-[20px] text-[var(--text)] mb-2">
                  Tài khoản đang chờ duyệt
                </h3>
                <p className="text-[13px] text-[var(--muted)] mb-2 max-w-[320px] mx-auto">
                  Kiểm tra email <strong>{email}</strong> để xác nhận tài khoản. Sau khi xác nhận, admin sẽ duyệt để bạn có thể truy cập hệ thống.
                </p>
                <p className="text-[12px] text-[var(--amber)] font-medium mb-6">
                  Trạng thái: Đang chờ (Pending)
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[13px] text-[var(--purple)] font-medium hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
            <CardTitle className="font-serif text-[22px]">Đăng ký tài khoản</CardTitle>
            <CardDescription className="text-[13px] text-[var(--muted)]">
              Tạo tài khoản mới — sẽ cần admin duyệt trước khi sử dụng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[13px] font-medium">
                  Họ và tên
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-10 text-[13px] border-[var(--gray-m)] focus:border-[var(--purple)] focus:ring-[var(--purple)]/10"
                />
              </div>
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
                <Label htmlFor="password" className="text-[13px] font-medium">
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ít nhất 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-10 text-[13px] border-[var(--gray-m)] focus:border-[var(--purple)] focus:ring-[var(--purple)]/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[13px] font-medium">
                  Xác nhận mật khẩu
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
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
                  "Đăng ký"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-[13px] text-[var(--muted)]">
                Đã có tài khoản?{" "}
                <Link
                  href="/login"
                  className="text-[var(--purple)] font-medium hover:underline"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
