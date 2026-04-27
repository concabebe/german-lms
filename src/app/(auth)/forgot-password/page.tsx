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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/update`,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    toast.success("Đã gửi link đặt lại mật khẩu!");
    setLoading(false);
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
            <CardTitle className="font-serif text-[22px]">Quên mật khẩu</CardTitle>
            <CardDescription className="text-[13px] text-[var(--muted)]">
              Nhập email để nhận link đặt lại mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[var(--teal-l)] flex items-center justify-center mx-auto mb-4">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--teal)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="text-[14px] font-medium text-[var(--text)] mb-2">
                  Email đã được gửi!
                </p>
                <p className="text-[13px] text-[var(--muted)] mb-6">
                  Kiểm tra hộp thư <strong>{email}</strong> để đặt lại mật khẩu.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[13px] text-[var(--purple)] font-medium hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleReset} className="space-y-4">
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
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[14px] font-medium rounded-lg"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Gửi link đặt lại"
                    )}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-[13px] text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Quay lại đăng nhập
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
