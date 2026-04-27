export type QuestionType =
  | "radio"
  | "checkbox"
  | "textarea"
  | "text"
  | "scale"
  | "number";

export interface ConditionalConfig {
  triggerValue: string;
  label: string;
  placeholder: string;
}

export interface QuestionDef {
  key: string;
  text: string;
  type: QuestionType;
  helper?: string;
  options?: string[];
  hasOther?: boolean;
  maxSelect?: number;
  conditional?: ConditionalConfig;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  numberUnit?: string;
  numberPlaceholder?: string;
}

export interface SectionDef {
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  keys: string[];
}

export type GroupKey = "lrn" | "gen" | "tch" | "par" | "cns" | "clt";

export interface GroupDef {
  key: GroupKey;
  label: string;
  fullLabel: string;
  dotColor: string;
  questionCount: number;
  eyebrow: string;
  title: string;
  description: string;
}

export const GROUP_DEFS: GroupDef[] = [
  {
    key: "lrn",
    label: "LRN — Người học",
    fullLabel: "Learner",
    dotColor: "#1D9E75",
    questionCount: 44,
    eyebrow: "Section LRN · Người học tiếng Đức",
    title: "Học viên — XKLĐ, Sinh viên, Tự học",
    description:
      "44 câu · 6 sections. Mỗi interview chọn 15–18 câu phù hợp với segment.",
  },
  {
    key: "gen",
    label: "GEN — Chung",
    fullLabel: "General",
    dotColor: "#534AB7",
    questionCount: 6,
    eyebrow: "Section GEN · Tất cả nhóm non-learner",
    title: "Thông tin chung",
    description:
      "6 câu screening chung cho tất cả nhóm non-learner. Hỏi trước khi vào section chuyên biệt.",
  },
  {
    key: "tch",
    label: "TCH — Giáo viên",
    fullLabel: "Teacher",
    dotColor: "#0F6E56",
    questionCount: 9,
    eyebrow: "Section TCH · Giáo viên & Giảng viên",
    title: "Bối cảnh giảng dạy & kỳ vọng LMS",
    description:
      "9 câu · 2 phần: Teaching Context (A) và LMS Expectations (B).",
  },
  {
    key: "par",
    label: "PAR — Phụ huynh",
    fullLabel: "Parent",
    dotColor: "#993C1D",
    questionCount: 5,
    eyebrow: "Section PAR · Phụ huynh",
    title: "Gia đình & quyết định cho con học",
    description:
      "5 câu · 2 phần: Family Context (A) và Expectations & Budget (B).",
  },
  {
    key: "cns",
    label: "CNS — Tư vấn",
    fullLabel: "Counselor",
    dotColor: "#185FA5",
    questionCount: 4,
    eyebrow: "Section CNS · Nhân viên tư vấn",
    title: "Bối cảnh tư vấn & cơ hội partnership",
    description:
      "4 câu · 2 phần: Counselor Context (A) và Partnership & Portal (B).",
  },
  {
    key: "clt",
    label: "CLT — Lãnh sự",
    fullLabel: "Cultural Official",
    dotColor: "#854F0B",
    questionCount: 5,
    eyebrow: "Section CLT · Lãnh sự quán & Cơ quan văn hoá",
    title: "Tiêu chuẩn & cơ hội hợp tác",
    description:
      "5 câu · 2 phần: Institutional Context (A) và Standards & Collaboration (B).",
  },
];

export const RESPONDENT_TYPE_TO_GROUPS: Record<string, GroupKey[]> = {
  learner: ["lrn"],
  teacher: ["gen", "tch"],
  parent: ["gen", "par"],
  counselor: ["gen", "cns"],
  cultural_official: ["gen", "clt"],
};
