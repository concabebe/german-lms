"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface SettingsState {
  appName: string;
  logoUrl: string;
  emailOnNewUser: boolean;
  emailOnSessionComplete: boolean;
  emailWeeklyDigest: boolean;
  retentionDays: string;
  autoArchiveDays: string;
}

export function SettingsTab() {
  const [settings, setSettings] = useState<SettingsState>({
    appName: "LMS Tiếng Đức",
    logoUrl: "",
    emailOnNewUser: true,
    emailOnSessionComplete: false,
    emailWeeklyDigest: true,
    retentionDays: "365",
    autoArchiveDays: "90",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Settings would be persisted to a settings table or admin_insights
    // For now, just show success
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Đã lưu cài đặt");
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      {/* App Info */}
      <Section title="Thông tin ứng dụng">
        <div className="space-y-4">
          <div>
            <Label className="text-[12px] font-medium text-[var(--text)] mb-1.5 block">
              Tên ứng dụng
            </Label>
            <Input
              value={settings.appName}
              onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              className="text-[13px] border-[var(--gray-m)]"
            />
          </div>
          <div>
            <Label className="text-[12px] font-medium text-[var(--text)] mb-1.5 block">
              Logo
            </Label>
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <div className="w-12 h-12 rounded-lg border border-[var(--gray-m)] bg-[var(--purple-l)] flex items-center justify-center">
                  <span className="text-[14px] font-serif font-bold text-[var(--purple)]">L</span>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg border border-dashed border-[var(--gray-m)] flex items-center justify-center bg-[var(--gray-l)]">
                  <Upload className="h-4 w-4 text-[var(--muted)]" />
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-[12px] border-[var(--gray-m)] text-[var(--muted)]"
                onClick={() => toast.info("Upload logo: sử dụng Supabase Storage → Settings bucket")}
              >
                Tải lên logo
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Email Notifications */}
      <Section title="Thông báo email">
        <div className="space-y-3">
          <ToggleRow
            label="User mới đăng ký"
            description="Gửi email khi có user mới chờ duyệt"
            checked={settings.emailOnNewUser}
            onChange={(v) => setSettings({ ...settings, emailOnNewUser: v })}
          />
          <ToggleRow
            label="Session hoàn thành"
            description="Gửi email khi interviewer hoàn thành 1 phiên"
            checked={settings.emailOnSessionComplete}
            onChange={(v) => setSettings({ ...settings, emailOnSessionComplete: v })}
          />
          <ToggleRow
            label="Báo cáo tuần"
            description="Gửi email tóm tắt hoạt động hàng tuần"
            checked={settings.emailWeeklyDigest}
            onChange={(v) => setSettings({ ...settings, emailWeeklyDigest: v })}
          />
        </div>
      </Section>

      {/* Data Retention */}
      <Section title="Lưu trữ dữ liệu">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-[12px] font-medium text-[var(--text)] mb-1.5 block">
              Giữ dữ liệu (ngày)
            </Label>
            <Input
              type="number"
              value={settings.retentionDays}
              onChange={(e) => setSettings({ ...settings, retentionDays: e.target.value })}
              className="text-[13px] border-[var(--gray-m)]"
            />
            <p className="text-[11px] text-[var(--muted)] mt-1">
              Dữ liệu cũ hơn sẽ bị xoá tự động
            </p>
          </div>
          <div>
            <Label className="text-[12px] font-medium text-[var(--text)] mb-1.5 block">
              Tự động archive (ngày)
            </Label>
            <Input
              type="number"
              value={settings.autoArchiveDays}
              onChange={(e) => setSettings({ ...settings, autoArchiveDays: e.target.value })}
              className="text-[13px] border-[var(--gray-m)]"
            />
            <p className="text-[11px] text-[var(--muted)] mt-1">
              Draft sessions quá hạn sẽ tự archive
            </p>
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-[var(--gray-m)]">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[12px]"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1.5" />
          )}
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="font-serif text-[16px] text-[var(--text)] mb-4">{title}</h3>
      <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-5">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-[13px] font-medium text-[var(--text)]">{label}</p>
        <p className="text-[11px] text-[var(--muted)]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative ${
          checked ? "bg-[var(--purple)]" : "bg-[var(--gray-m)]"
        }`}
      >
        <div
          className={`w-4 h-4 bg-[var(--white)] rounded-full shadow-sm absolute top-0.5 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
