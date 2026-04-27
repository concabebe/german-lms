"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const RESPONDENT_TYPES = [
  { value: "learner", label: "Người học (Learner)" },
  { value: "teacher", label: "Giáo viên (Teacher)" },
  { value: "parent", label: "Phụ huynh (Parent)" },
  { value: "counselor", label: "Tư vấn viên (Counselor)" },
  { value: "cultural_official", label: "Cán bộ văn hoá (Cultural Official)" },
];

const GENDERS = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
];

interface NewSessionFormProps {
  userId: string;
}

export function NewSessionForm({ userId }: NewSessionFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [respondentType, setRespondentType] = useState("learner");
  const [fullName, setFullName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("Nam");
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Bắt buộc";
    if (!birthYear.trim()) {
      errs.birthYear = "Bắt buộc";
    } else {
      const year = parseInt(birthYear, 10);
      if (isNaN(year) || year < 1920 || year > new Date().getFullYear()) {
        errs.birthYear = "Năm không hợp lệ";
      }
    }
    if (!location.trim()) errs.location = "Bắt buộc";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("interview_sessions")
      .insert({
        created_by: userId,
        respondent_type: respondentType,
        respondent_full_name: fullName.trim(),
        respondent_birth_year: parseInt(birthYear, 10),
        respondent_gender: gender as "Nam" | "Nữ" | "Khác",
        respondent_location: location.trim(),
        respondent_occupation: occupation.trim() || null,
        respondent_phone: phone.trim() || null,
        session_status: "draft",
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Không thể tạo phiên: " + error.message);
      setSubmitting(false);
      return;
    }

    toast.success("Đã tạo phiên mới");
    router.push(`/sessions/${data.id}/questions`);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-10">
      <button
        type="button"
        onClick={() => router.push("/sessions")}
        className="flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại danh sách
      </button>

      <h2 className="font-serif text-[28px] text-[var(--text)] mb-2">
        Phiên interview mới
      </h2>
      <p className="text-[13px] text-[var(--muted)] mb-8">
        Bước 1: Nhập thông tin respondent. Sau khi lưu, bạn sẽ được chuyển đến
        phần câu hỏi.
      </p>

      <div className="space-y-6">
        {/* Respondent type */}
        <div>
          <Label className="text-[13px] font-medium text-[var(--text)] mb-2 block">
            Nhóm respondent <span className="text-[var(--coral)]">*</span>
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {RESPONDENT_TYPES.map((rt) => (
              <button
                key={rt.value}
                type="button"
                onClick={() => setRespondentType(rt.value)}
                className={`text-left px-4 py-3 border rounded-lg text-[13px] transition-all ${
                  respondentType === rt.value
                    ? "border-[var(--purple)] bg-[var(--purple-l)] text-[var(--purple)] font-medium"
                    : "border-[var(--gray-m)] text-[var(--text)] hover:bg-[var(--gray-l)]"
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Full name */}
        <div>
          <Label className="text-[13px] font-medium text-[var(--text)] mb-2 block">
            Họ tên <span className="text-[var(--coral)]">*</span>
          </Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="VD: Nguyễn Văn A"
            className={`border-[var(--gray-m)] text-[13px] ${
              errors.fullName ? "border-[var(--coral)]" : ""
            }`}
          />
          {errors.fullName && (
            <p className="text-[11px] text-[var(--coral)] mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Birth year + Gender row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-[13px] font-medium text-[var(--text)] mb-2 block">
              Năm sinh <span className="text-[var(--coral)]">*</span>
            </Label>
            <Input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="VD: 1998"
              className={`border-[var(--gray-m)] text-[13px] ${
                errors.birthYear ? "border-[var(--coral)]" : ""
              }`}
            />
            {errors.birthYear && (
              <p className="text-[11px] text-[var(--coral)] mt-1">{errors.birthYear}</p>
            )}
          </div>
          <div>
            <Label className="text-[13px] font-medium text-[var(--text)] mb-2 block">
              Giới tính <span className="text-[var(--coral)]">*</span>
            </Label>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg text-[13px] transition-all ${
                    gender === g.value
                      ? "border-[var(--purple)] bg-[var(--purple-l)] text-[var(--purple)] font-medium"
                      : "border-[var(--gray-m)] text-[var(--text)] hover:bg-[var(--gray-l)]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <Label className="text-[13px] font-medium text-[var(--text)] mb-2 block">
            Địa điểm <span className="text-[var(--coral)]">*</span>
          </Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="VD: TP. Hồ Chí Minh"
            className={`border-[var(--gray-m)] text-[13px] ${
              errors.location ? "border-[var(--coral)]" : ""
            }`}
          />
          {errors.location && (
            <p className="text-[11px] text-[var(--coral)] mt-1">{errors.location}</p>
          )}
        </div>

        {/* Occupation */}
        <div>
          <Label className="text-[13px] font-medium text-[var(--text)] mb-2 block">
            Nghề nghiệp
          </Label>
          <Input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="VD: Sinh viên, Kỹ sư, Giáo viên..."
            className="border-[var(--gray-m)] text-[13px]"
          />
        </div>

        {/* Phone */}
        <div>
          <Label className="text-[13px] font-medium text-[var(--text)] mb-2 block">
            Số điện thoại
          </Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="VD: 0912 345 678"
            className="border-[var(--gray-m)] text-[13px]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--gray-m)]">
          <Button
            variant="outline"
            onClick={() => router.push("/sessions")}
            className="text-[13px] border-[var(--gray-m)] text-[var(--muted)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[13px] font-medium"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-1.5" />
            )}
            {submitting ? "Đang lưu..." : "Tiếp tục →"}
          </Button>
        </div>
      </div>
    </main>
  );
}
