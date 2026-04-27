"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpdate(e: React.FormEvent) {
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
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Mật khẩu đã được cập nhật!");
    router.push("/login");
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
            <CardTitle className="font-serif text-[22px]">Đặt mật khẩu mới</CardTitle>
            <CardDescription className="text-[13px] text-[var(--muted)]">
              Nhập mật khẩu mới cho tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] font-medium">
                  Mật khẩu mới
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
                  Xác nhận mật khẩu mới
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
                  "Cập nhật mật khẩu"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
