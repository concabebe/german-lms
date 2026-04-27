import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export interface MVPFeature {
  feature: string;
  overallPct: number;
  segments: Record<string, number>;
  tier: "Must-have" | "Important" | "Nice-to-have";
}

export interface SegmentBubble {
  name: string;
  size: number;
  avgWTP: number;
}

export interface HeatmapCell {
  segment: string;
  pain: string;
  value: number;
}

export interface PricingTier {
  tier: string;
  range: string;
  price: string;
}

export interface ConversionBarrier {
  factor: string;
  detractorCount: number;
  totalMentions: number;
}

export interface CompetitiveGap {
  gap: string;
  count: number;
  rank: number;
}

export interface DropoutRisk {
  trigger: string;
  segments: Record<string, number>;
}

export interface NotableNote {
  id: string;
  sessionId: string;
  sectionKey: string;
  noteText: string;
  sentiment: string | null;
  respondentName: string;
  respondentType: string;
}

export interface ProductAnalysisData {
  mvpMatrix: MVPFeature[];
  segmentBubbles: SegmentBubble[];
  heatmap: HeatmapCell[];
  heatmapSegments: string[];
  heatmapPains: string[];
  wtpDistribution: { value: number; count: number }[];
  wtpPercentiles: { p25: number; p50: number; p75: number };
  pricingTiers: PricingTier[];
  trustSignals: { name: string; value: number }[];
  conversionBarriers: ConversionBarrier[];
  landingPageRecs: string[];
  competitiveGaps: CompetitiveGap[];
  dropoutRisks: DropoutRisk[];
  dropoutSegments: string[];
  notableNotes: NotableNote[];
  adminInsights: Record<string, string>;
}

function extractValues(answer: Json): string[] {
  if (typeof answer === "string") return [answer];
  if (Array.isArray(answer)) return answer.filter((v): v is string => typeof v === "string");
  if (typeof answer === "object" && answer !== null) {
    const obj = answer as Record<string, Json | undefined>;
    if (Array.isArray(obj.value)) return obj.value.filter((v): v is string => typeof v === "string");
    if (typeof obj.value === "string") return [obj.value];
  }
  return [];
}

function extractNumeric(answer: Json): number | null {
  if (typeof answer === "number") return answer;
  if (typeof answer === "string") { const n = parseFloat(answer); return isNaN(n) ? null : n; }
  return null;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return Math.round(sorted[lower] + (idx - lower) * (sorted[upper] - sorted[lower]));
}

export async function fetchProductAnalysisData(): Promise<ProductAnalysisData> {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id, respondent_type, respondent_full_name")
    .eq("session_status", "completed");

  const sessionIds = (sessions || []).map((s) => s.id);
  const sessionType: Record<string, string> = {};
  const sessionName: Record<string, string> = {};
  for (const s of sessions || []) {
    sessionType[s.id] = s.respondent_type;
    sessionName[s.id] = s.respondent_full_name;
  }

  let allResponses: { question_key: string; answer_value: Json; session_id: string }[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("responses")
      .select("question_key, answer_value, session_id")
      .in("session_id", sessionIds);
    allResponses = data || [];
  }

  // --- A. MVP Scope Matrix ---
  const sessionSegment: Record<string, string> = {};
  for (const r of allResponses) {
    if (r.question_key === "S2" && typeof r.answer_value === "string") {
      sessionSegment[r.session_id] = r.answer_value;
    }
  }

  const featureCounts: Record<string, { total: number; bySegment: Record<string, number> }> = {};
  const segmentsSet = new Set<string>();
  for (const r of allResponses) {
    if (r.question_key !== "K2") continue;
    const features = extractValues(r.answer_value);
    const seg = sessionSegment[r.session_id] || sessionType[r.session_id] || "unknown";
    segmentsSet.add(seg);
    for (const f of features) {
      if (!featureCounts[f]) featureCounts[f] = { total: 0, bySegment: {} };
      featureCounts[f].total++;
      featureCounts[f].bySegment[seg] = (featureCounts[f].bySegment[seg] || 0) + 1;
    }
  }

  const totalSessions = sessionIds.length || 1;
  const segmentTotals: Record<string, number> = {};
  for (const sid of sessionIds) {
    const seg = sessionSegment[sid] || sessionType[sid] || "unknown";
    segmentTotals[seg] = (segmentTotals[seg] || 0) + 1;
  }

  const mvpMatrix: MVPFeature[] = Object.entries(featureCounts)
    .map(([feature, data]) => {
      const overallPct = Math.round((data.total / totalSessions) * 100);
      const segments: Record<string, number> = {};
      for (const seg of Array.from(segmentsSet)) {
        const segTotal = segmentTotals[seg] || 1;
        segments[seg] = Math.round(((data.bySegment[seg] || 0) / segTotal) * 100);
      }
      const tier: MVPFeature["tier"] = overallPct >= 70 ? "Must-have" : overallPct >= 40 ? "Important" : "Nice-to-have";
      return { feature, overallPct, segments, tier };
    })
    .sort((a, b) => b.overallPct - a.overallPct);

  // --- B. Segment Strategy ---
  const typeWTP: Record<string, number[]> = {};
  const typeCounts: Record<string, number> = {};
  for (const s of sessions || []) {
    typeCounts[s.respondent_type] = (typeCounts[s.respondent_type] || 0) + 1;
  }
  for (const r of allResponses) {
    if (r.question_key !== "T2") continue;
    const val = extractNumeric(r.answer_value);
    if (val === null) continue;
    const type = sessionType[r.session_id];
    if (!type) continue;
    if (!typeWTP[type]) typeWTP[type] = [];
    typeWTP[type].push(val);
  }
  const segmentBubbles: SegmentBubble[] = Object.entries(typeCounts).map(([name, size]) => ({
    name: SEGMENT_LABELS[name] || name,
    size,
    avgWTP: typeWTP[name]?.length ? Math.round(typeWTP[name].reduce((a, b) => a + b, 0) / typeWTP[name].length) : 0,
  }));

  const painBySegment: Record<string, Record<string, number>> = {};
  const allPains = new Set<string>();
  const allSegments = new Set<string>();
  for (const r of allResponses) {
    if (r.question_key !== "P1") continue;
    const type = sessionType[r.session_id];
    if (!type) continue;
    allSegments.add(type);
    for (const p of extractValues(r.answer_value)) {
      allPains.add(p);
      if (!painBySegment[type]) painBySegment[type] = {};
      painBySegment[type][p] = (painBySegment[type][p] || 0) + 1;
    }
  }
  const heatmapSegments = Array.from(allSegments);
  const heatmapPains = Array.from(allPains);
  const heatmap: HeatmapCell[] = [];
  for (const seg of heatmapSegments) {
    for (const pain of heatmapPains) {
      heatmap.push({ segment: seg, pain, value: painBySegment[seg]?.[pain] || 0 });
    }
  }

  // --- C. Pricing Analysis ---
  const allWTP: number[] = [];
  for (const r of allResponses) {
    if (r.question_key !== "T2") continue;
    const val = extractNumeric(r.answer_value);
    if (val !== null) allWTP.push(val);
  }
  allWTP.sort((a, b) => a - b);

  const wtpBuckets: Record<number, number> = {};
  for (const v of allWTP) wtpBuckets[v] = (wtpBuckets[v] || 0) + 1;
  const wtpDistribution = Object.entries(wtpBuckets)
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((a, b) => a.value - b.value);

  const p25 = percentile(allWTP, 25);
  const p50 = percentile(allWTP, 50);
  const p75 = percentile(allWTP, 75);

  const pricingTiers: PricingTier[] = [
    { tier: "Entry", range: `< ${p50}k`, price: `${p25}k VND/tháng` },
    { tier: "Standard", range: `${p50}k – ${p75}k`, price: `${p50}k VND/tháng` },
    { tier: "Premium", range: `> ${p75}k`, price: `${p75}k VND/tháng` },
  ];

  // --- D. Trust & Conversion ---
  const trustCounts: Record<string, number> = {};
  for (const r of allResponses) {
    if (r.question_key !== "T5") continue;
    for (const v of extractValues(r.answer_value)) {
      trustCounts[v] = (trustCounts[v] || 0) + 1;
    }
  }
  const trustSignals = Object.entries(trustCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const detractorSessions = new Set<string>();
  for (const r of allResponses) {
    if (r.question_key !== "T6") continue;
    const val = extractNumeric(r.answer_value);
    if (val !== null && val <= 6) detractorSessions.add(r.session_id);
  }
  const barrierCounts: Record<string, { detractor: number; total: number }> = {};
  for (const r of allResponses) {
    if (r.question_key !== "T4") continue;
    for (const v of extractValues(r.answer_value)) {
      if (!barrierCounts[v]) barrierCounts[v] = { detractor: 0, total: 0 };
      barrierCounts[v].total++;
      if (detractorSessions.has(r.session_id)) barrierCounts[v].detractor++;
    }
  }
  const conversionBarriers: ConversionBarrier[] = Object.entries(barrierCounts)
    .map(([factor, counts]) => ({ factor, detractorCount: counts.detractor, totalMentions: counts.total }))
    .sort((a, b) => b.detractorCount - a.detractorCount);

  const landingPageRecs = trustSignals.slice(0, 5).map((t) => t.name);

  // --- E. Risk & Gaps ---
  const gapCounts: Record<string, number> = {};
  for (const r of allResponses) {
    if (r.question_key !== "P4") continue;
    for (const v of extractValues(r.answer_value)) {
      gapCounts[v] = (gapCounts[v] || 0) + 1;
    }
  }
  const competitiveGaps: CompetitiveGap[] = Object.entries(gapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([gap, count], i) => ({ gap, count, rank: i + 1 }));

  const dropoutBySegment: Record<string, Record<string, number>> = {};
  const allDropoutTriggers = new Set<string>();
  const dropoutSegmentsSet = new Set<string>();
  for (const r of allResponses) {
    if (r.question_key !== "P2") continue;
    const type = sessionType[r.session_id];
    if (!type) continue;
    dropoutSegmentsSet.add(type);
    for (const v of extractValues(r.answer_value)) {
      allDropoutTriggers.add(v);
      if (!dropoutBySegment[v]) dropoutBySegment[v] = {};
      dropoutBySegment[v][type] = (dropoutBySegment[v][type] || 0) + 1;
    }
  }
  const dropoutRisks: DropoutRisk[] = Array.from(allDropoutTriggers).map((trigger) => ({
    trigger,
    segments: dropoutBySegment[trigger] || {},
  }));
  const dropoutSegments = Array.from(dropoutSegmentsSet);

  // --- F. Qualitative Signals ---
  let notableNotes: NotableNote[] = [];
  if (sessionIds.length > 0) {
    const { data: notes } = await supabase
      .from("session_notes")
      .select("id, session_id, section_key, note_text, sentiment_hint")
      .eq("is_notable", true)
      .in("session_id", sessionIds)
      .order("created_at", { ascending: false })
      .limit(10);

    notableNotes = (notes || []).map((n) => ({
      id: n.id,
      sessionId: n.session_id,
      sectionKey: n.section_key,
      noteText: n.note_text,
      sentiment: n.sentiment_hint,
      respondentName: sessionName[n.session_id] || "Unknown",
      respondentType: sessionType[n.session_id] || "unknown",
    }));
  }

  // --- Admin Insights ---
  const { data: insights } = await supabase
    .from("admin_insights")
    .select("section_key, content");

  const adminInsights: Record<string, string> = {};
  for (const i of insights || []) {
    adminInsights[i.section_key] = i.content;
  }

  return {
    mvpMatrix,
    segmentBubbles,
    heatmap,
    heatmapSegments,
    heatmapPains,
    wtpDistribution,
    wtpPercentiles: { p25, p50, p75 },
    pricingTiers,
    trustSignals,
    conversionBarriers,
    landingPageRecs,
    competitiveGaps,
    dropoutRisks,
    dropoutSegments,
    notableNotes,
    adminInsights,
  };
}

const SEGMENT_LABELS: Record<string, string> = {
  learner: "Người học",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  counselor: "Tư vấn viên",
  cultural_official: "Cán bộ văn hoá",
};
