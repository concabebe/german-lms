import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface GroupedChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface InsightsFilters {
  dateFrom?: string;
  dateTo?: string;
  respondentType?: string;
  interviewerId?: string;
}

export interface KPIData {
  totalSessions: number;
  totalRespondents: number;
  topSegment: string;
  avgWTP: number;
  npsScore: number;
  pctWithDeadline: number;
}

export interface InsightsData {
  kpi: KPIData;
  a1: ChartDataPoint[];
  a2: ChartDataPoint[];
  a3: ChartDataPoint[];
  a4: ChartDataPoint[];
  a5: ChartDataPoint[];
  b1: ChartDataPoint[];
  b2: ChartDataPoint[];
  b3: ChartDataPoint[];
  b4: ChartDataPoint[];
  c1: ChartDataPoint[];
  c2: ChartDataPoint[];
  c3: ChartDataPoint[];
  d1: ChartDataPoint[];
  d2: GroupedChartDataPoint[];
  d3: ChartDataPoint[];
  d4: ChartDataPoint[];
  e1: GroupedChartDataPoint[];
  e2: ChartDataPoint[];
  e3: ChartDataPoint[];
  f1: ChartDataPoint[];
  f2: ChartDataPoint[];
  g1: ChartDataPoint[];
  g2: ChartDataPoint[];
  g3: { totalSections: number; withNotes: number; rate: number };
}

function countRadioAnswers(
  responses: { question_key: string; answer_value: Json }[],
  questionKey: string
): ChartDataPoint[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    if (r.question_key !== questionKey) continue;
    const val = r.answer_value;
    if (typeof val === "string") {
      counts[val] = (counts[val] || 0) + 1;
    } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      const obj = val as Record<string, Json | undefined>;
      if (typeof obj.value === "string") {
        counts[obj.value] = (counts[obj.value] || 0) + 1;
      }
      if (Array.isArray(obj.value)) {
        for (const v of obj.value) {
          if (typeof v === "string") counts[v] = (counts[v] || 0) + 1;
        }
      }
    }
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function countCheckboxAnswers(
  responses: { question_key: string; answer_value: Json }[],
  questionKey: string
): ChartDataPoint[] {
  const counts: Record<string, number> = {};
  for (const r of responses) {
    if (r.question_key !== questionKey) continue;
    const val = r.answer_value;
    if (Array.isArray(val)) {
      for (const v of val) {
        if (typeof v === "string") counts[v] = (counts[v] || 0) + 1;
      }
    } else if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, Json | undefined>;
      if (Array.isArray(obj.value)) {
        for (const v of obj.value) {
          if (typeof v === "string") counts[v] = (counts[v] || 0) + 1;
        }
      }
    }
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function getNumericAnswers(
  responses: { question_key: string; answer_value: Json }[],
  questionKey: string
): number[] {
  const values: number[] = [];
  for (const r of responses) {
    if (r.question_key !== questionKey) continue;
    const val = r.answer_value;
    if (typeof val === "number") values.push(val);
    if (typeof val === "string") {
      const n = parseFloat(val);
      if (!isNaN(n)) values.push(n);
    }
  }
  return values;
}

function crossTabCheckboxByRadio(
  responses: { question_key: string; answer_value: Json; session_id: string }[],
  checkboxKey: string,
  radioKey: string
): GroupedChartDataPoint[] {
  const sessionRadio: Record<string, string> = {};
  const featureSegment: Record<string, Record<string, number>> = {};
  const segments = new Set<string>();

  for (const r of responses) {
    if (r.question_key === radioKey && typeof r.answer_value === "string") {
      sessionRadio[r.session_id] = r.answer_value;
      segments.add(r.answer_value);
    }
  }

  for (const r of responses) {
    if (r.question_key !== checkboxKey) continue;
    const seg = sessionRadio[r.session_id];
    if (!seg) continue;

    const vals: string[] = [];
    if (Array.isArray(r.answer_value)) {
      for (const v of r.answer_value) {
        if (typeof v === "string") vals.push(v);
      }
    } else if (typeof r.answer_value === "object" && r.answer_value !== null) {
      const obj = r.answer_value as Record<string, Json | undefined>;
      if (Array.isArray(obj.value)) {
        for (const v of obj.value) {
          if (typeof v === "string") vals.push(v);
        }
      }
    }

    for (const feat of vals) {
      if (!featureSegment[feat]) featureSegment[feat] = {};
      featureSegment[feat][seg] = (featureSegment[feat][seg] || 0) + 1;
    }
  }

  return Object.entries(featureSegment).map(([name, segCounts]) => {
    const point: GroupedChartDataPoint = { name };
    for (const seg of Array.from(segments)) {
      point[seg] = segCounts[seg] || 0;
    }
    return point;
  });
}

function crossTabNumericByRadio(
  responses: { question_key: string; answer_value: Json; session_id: string }[],
  numericKey: string,
  radioKey: string
): GroupedChartDataPoint[] {
  const sessionRadio: Record<string, string> = {};
  const segValues: Record<string, number[]> = {};

  for (const r of responses) {
    if (r.question_key === radioKey && typeof r.answer_value === "string") {
      sessionRadio[r.session_id] = r.answer_value;
    }
  }

  for (const r of responses) {
    if (r.question_key !== numericKey) continue;
    const seg = sessionRadio[r.session_id];
    if (!seg) continue;
    const val =
      typeof r.answer_value === "number"
        ? r.answer_value
        : typeof r.answer_value === "string"
          ? parseFloat(r.answer_value)
          : NaN;
    if (!isNaN(val)) {
      if (!segValues[seg]) segValues[seg] = [];
      segValues[seg].push(val);
    }
  }

  return Object.entries(segValues).map(([name, vals]) => ({
    name,
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    count: vals.length,
  }));
}

export async function fetchInsightsData(
  filters: InsightsFilters
): Promise<InsightsData> {
  const supabase = await createClient();

  let sessionsQuery = supabase
    .from("interview_sessions")
    .select("id, respondent_type, respondent_location, respondent_gender, created_by, created_at")
    .eq("session_status", "completed");

  if (filters.dateFrom) sessionsQuery = sessionsQuery.gte("created_at", filters.dateFrom);
  if (filters.dateTo) sessionsQuery = sessionsQuery.lte("created_at", filters.dateTo);
  if (filters.respondentType) sessionsQuery = sessionsQuery.eq("respondent_type", filters.respondentType);
  if (filters.interviewerId) sessionsQuery = sessionsQuery.eq("created_by", filters.interviewerId);

  const { data: sessions } = await sessionsQuery;
  const sessionIds = (sessions || []).map((s) => s.id);

  let allResponses: { question_key: string; answer_value: Json; session_id: string }[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("responses")
      .select("question_key, answer_value, session_id")
      .in("session_id", sessionIds);
    allResponses = data || [];
  }

  let allNotes: { section_key: string; sentiment_hint: string | null; tagged_questions: string[] | null; session_id: string }[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("session_notes")
      .select("section_key, sentiment_hint, tagged_questions, session_id")
      .in("session_id", sessionIds);
    allNotes = data || [];
  }

  // KPIs
  const totalSessions = sessionIds.length;
  const totalRespondents = new Set(sessionIds).size;

  const typeCounts: Record<string, number> = {};
  for (const s of sessions || []) {
    typeCounts[s.respondent_type] = (typeCounts[s.respondent_type] || 0) + 1;
  }
  const topSegment =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const wtpValues = getNumericAnswers(allResponses, "T2");
  const avgWTP =
    wtpValues.length > 0
      ? Math.round(wtpValues.reduce((a, b) => a + b, 0) / wtpValues.length)
      : 0;

  const npsValues = getNumericAnswers(allResponses, "T6");
  let npsScore = 0;
  if (npsValues.length > 0) {
    const promoters = npsValues.filter((v) => v >= 9).length;
    const detractors = npsValues.filter((v) => v <= 6).length;
    npsScore = Math.round(
      ((promoters - detractors) / npsValues.length) * 100
    );
  }

  const s4Answers = allResponses.filter(
    (r) => r.question_key === "S4" && r.answer_value === "Có"
  );
  const pctWithDeadline =
    totalSessions > 0 ? Math.round((s4Answers.length / totalSessions) * 100) : 0;

  // Section A
  const a1: ChartDataPoint[] = Object.entries(typeCounts).map(
    ([name, value]) => ({ name: SEGMENT_LABELS[name] || name, value })
  );
  const a2 = countRadioAnswers(allResponses, "S3");
  const a3 = countRadioAnswers(allResponses, "S1");
  const locationCounts: Record<string, number> = {};
  for (const s of sessions || []) {
    locationCounts[s.respondent_location] =
      (locationCounts[s.respondent_location] || 0) + 1;
  }
  const a4 = Object.entries(locationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const genderCounts: Record<string, number> = {};
  for (const s of sessions || []) {
    genderCounts[s.respondent_gender] =
      (genderCounts[s.respondent_gender] || 0) + 1;
  }
  const a5 = Object.entries(genderCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Section B
  const b1 = countRadioAnswers(allResponses, "B5");
  const b2 = countRadioAnswers(allResponses, "B6");
  const b3 = countRadioAnswers(allResponses, "B4");
  const b4 = countRadioAnswers(allResponses, "B3");

  // Section C
  const c1 = countCheckboxAnswers(allResponses, "P1");
  const c2 = countCheckboxAnswers(allResponses, "P2");
  const c3 = countCheckboxAnswers(allResponses, "P4");

  // Section D
  const d1 = countCheckboxAnswers(allResponses, "K2");
  const d2 = crossTabCheckboxByRadio(allResponses, "K2", "S2");
  const d3 = countRadioAnswers(allResponses, "B7");
  const d4 = countRadioAnswers(allResponses, "K5");

  // Section E
  const e1 = crossTabNumericByRadio(allResponses, "T2", "S2");
  const e2 = countRadioAnswers(allResponses, "T3");
  const e3 = countCheckboxAnswers(allResponses, "T4");

  // Section F
  const f1Data = getNumericAnswers(allResponses, "T6");
  const promoters = f1Data.filter((v) => v >= 9).length;
  const passives = f1Data.filter((v) => v >= 7 && v <= 8).length;
  const detractors = f1Data.filter((v) => v <= 6).length;
  const f1: ChartDataPoint[] = [
    { name: "Promoters (9-10)", value: promoters, fill: "#0F6E56" },
    { name: "Passives (7-8)", value: passives, fill: "#854F0B" },
    { name: "Detractors (0-6)", value: detractors, fill: "#993C1D" },
  ];
  const f2 = countCheckboxAnswers(allResponses, "T5");

  // Section G
  const sentimentCounts: Record<string, number> = {};
  for (const n of allNotes) {
    if (n.sentiment_hint) {
      sentimentCounts[n.sentiment_hint] =
        (sentimentCounts[n.sentiment_hint] || 0) + 1;
    }
  }
  const g1 = Object.entries(sentimentCounts).map(([name, value]) => ({
    name: SENTIMENT_LABELS[name] || name,
    value,
    fill: SENTIMENT_COLORS[name] || "#6B6560",
  }));

  const tagCounts: Record<string, number> = {};
  for (const n of allNotes) {
    if (n.tagged_questions) {
      for (const t of n.tagged_questions) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }
  }
  const g2 = Object.entries(tagCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  const totalSectionSlots = sessionIds.length * 6;
  const withNotes = allNotes.filter((n) => n.section_key !== "general").length;
  const g3 = {
    totalSections: totalSectionSlots,
    withNotes,
    rate: totalSectionSlots > 0 ? Math.round((withNotes / totalSectionSlots) * 100) : 0,
  };

  return {
    kpi: { totalSessions, totalRespondents, topSegment, avgWTP, npsScore, pctWithDeadline },
    a1, a2, a3, a4, a5,
    b1, b2, b3, b4,
    c1, c2, c3,
    d1, d2, d3, d4,
    e1, e2, e3,
    f1, f2,
    g1, g2, g3,
  };
}

const SEGMENT_LABELS: Record<string, string> = {
  learner: "Người học",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  counselor: "Tư vấn viên",
  cultural_official: "Cán bộ văn hoá",
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "Tích cực",
  negative: "Tiêu cực",
  neutral: "Trung lập",
  uncertain: "Không chắc",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#0F6E56",
  negative: "#993C1D",
  neutral: "#185FA5",
  uncertain: "#854F0B",
};
