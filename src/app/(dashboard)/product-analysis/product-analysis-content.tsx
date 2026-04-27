"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import {
  Save,
  Loader2,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import type { ProductAnalysisData } from "@/lib/utils/product-analysis";

const TIER_STYLES: Record<string, { bg: string; color: string }> = {
  "Must-have": { bg: "#E1F5EE", color: "#0F6E56" },
  Important: { bg: "#FAEEDA", color: "#854F0B" },
  "Nice-to-have": { bg: "#F5F4F0", color: "#6B6560" },
};

const SEGMENT_LABELS: Record<string, string> = {
  learner: "Người học",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  counselor: "Tư vấn viên",
  cultural_official: "Văn hoá",
};

const SENTIMENT_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  positive: { bg: "#E1F5EE", color: "#0F6E56", label: "Tích cực" },
  negative: { bg: "#FAECE7", color: "#993C1D", label: "Tiêu cực" },
  neutral: { bg: "#E6F1FB", color: "#185FA5", label: "Trung lập" },
  uncertain: { bg: "#FAEEDA", color: "#854F0B", label: "Không chắc" },
};

const BUBBLE_COLORS = ["#534AB7", "#0F6E56", "#993C1D", "#185FA5", "#854F0B"];

interface Props {
  data: ProductAnalysisData;
  userId: string;
}

export function ProductAnalysisContent({ data, userId }: Props) {
  const [insights, setInsights] = useState<Record<string, string>>(data.adminInsights);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [competitorRows, setCompetitorRows] = useState([
    { name: "Duolingo", price: "Free / 199k", note: "Gamified, no German-specific depth" },
    { name: "Goethe Institut", price: "3.500k+", note: "Official cert, expensive" },
    { name: "Preply", price: "500k+/hr", note: "1-on-1, high cost" },
  ]);

  const saveInsight = async (sectionKey: string) => {
    setSavingSection(sectionKey);
    const supabase = createClient();
    const content = insights[sectionKey] || "";

    const { data: existing } = await supabase
      .from("admin_insights")
      .select("id")
      .eq("section_key", sectionKey)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("admin_insights")
        .update({ content, updated_by: userId })
        .eq("section_key", sectionKey);
      if (error) toast.error("Lỗi lưu: " + error.message);
      else toast.success("Đã lưu insight");
    } else {
      const { error } = await supabase
        .from("admin_insights")
        .insert({ section_key: sectionKey, content, updated_by: userId });
      if (error) toast.error("Lỗi lưu: " + error.message);
      else toast.success("Đã lưu insight");
    }
    setSavingSection(null);
  };

  const lowData = data.mvpMatrix.length === 0;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h2 className="font-serif text-[28px] text-[var(--text)] mb-1">
          Product Analysis
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          Phân tích sâu dữ liệu user research → quyết định sản phẩm
        </p>
      </div>

      {lowData && (
        <div className="bg-[#FAEEDA] border border-[#EF9F27] rounded-lg p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#854F0B] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-[#854F0B]">Chưa đủ dữ liệu</p>
            <p className="text-[12px] text-[#854F0B]/80">
              Cần ít nhất 5 phiên hoàn thành để hiển thị phân tích chính xác.
            </p>
          </div>
        </div>
      )}

      {/* Section A — MVP Scope Matrix */}
      <SectionTitle id="A" title="MVP Scope Matrix" />
      <div className="bg-white border border-[var(--gray-m)] rounded-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--gray-m)] bg-[var(--gray-l)]">
                <th className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">
                  Feature
                </th>
                <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">
                  Overall
                </th>
                {data.mvpMatrix.length > 0 &&
                  Object.keys(data.mvpMatrix[0].segments).map((seg) => (
                    <th
                      key={seg}
                      className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]"
                    >
                      {SEGMENT_LABELS[seg] || seg}
                    </th>
                  ))}
                <th className="text-center px-3 py-3 text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)]">
                  Tier
                </th>
              </tr>
            </thead>
            <tbody>
              {data.mvpMatrix.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-[var(--gray-l)] hover:bg-[var(--gray-l)]/50"
                >
                  <td className="px-4 py-2.5 text-[13px] text-[var(--text)]">
                    {row.feature}
                  </td>
                  <td className="text-center px-3 py-2.5 text-[13px] font-mono font-medium text-[var(--text)]">
                    {row.overallPct}%
                  </td>
                  {Object.entries(row.segments).map(([seg, pct]) => (
                    <td
                      key={seg}
                      className="text-center px-3 py-2.5 text-[12px] font-mono text-[var(--muted)]"
                    >
                      {pct}%
                    </td>
                  ))}
                  <td className="text-center px-3 py-2.5">
                    <span
                      className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full"
                      style={TIER_STYLES[row.tier]}
                    >
                      {row.tier}
                    </span>
                  </td>
                </tr>
              ))}
              {data.mvpMatrix.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[13px] text-[var(--muted)] italic">
                    Chưa có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B — Segment Strategy */}
      <SectionTitle id="B" title="Segment Strategy" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Bubble chart */}
        <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5">
          <h4 className="text-[14px] font-semibold text-[var(--text)] mb-3">
            Segment size vs Avg WTP
          </h4>
          {data.segmentBubbles.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-m)" />
                <XAxis
                  type="number"
                  dataKey="size"
                  name="Size"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  label={{ value: "Segment size", position: "bottom", fontSize: 11, fill: "var(--muted)" }}
                />
                <YAxis
                  type="number"
                  dataKey="avgWTP"
                  name="Avg WTP"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  label={{ value: "Avg WTP (k)", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--muted)" }}
                />
                <ZAxis type="number" dataKey="size" range={[100, 600]} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--gray-m)" }}
                  formatter={(value, name) => [String(value), String(name)]}
                />
                <Scatter data={data.segmentBubbles} name="Segment">
                  {data.segmentBubbles.map((_, i) => (
                    <Cell key={i} fill={BUBBLE_COLORS[i % BUBBLE_COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Heatmap */}
        <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5">
          <h4 className="text-[14px] font-semibold text-[var(--text)] mb-3">
            Pain × Segment heatmap
          </h4>
          {data.heatmap.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1 text-[10px] font-mono text-[var(--muted)]" />
                    {data.heatmapSegments.map((seg) => (
                      <th key={seg} className="text-center px-2 py-1 text-[10px] font-mono text-[var(--muted)]">
                        {SEGMENT_LABELS[seg] || seg}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.heatmapPains.map((pain) => (
                    <tr key={pain}>
                      <td className="px-2 py-1 text-[11px] text-[var(--text)] max-w-[150px] truncate">
                        {pain}
                      </td>
                      {data.heatmapSegments.map((seg) => {
                        const cell = data.heatmap.find(
                          (h) => h.segment === seg && h.pain === pain
                        );
                        const val = cell?.value || 0;
                        const maxVal = Math.max(...data.heatmap.map((h) => h.value), 1);
                        const intensity = val / maxVal;
                        return (
                          <td
                            key={seg}
                            className="text-center px-2 py-1 text-[11px] font-mono"
                            style={{
                              backgroundColor: `rgba(153, 60, 29, ${intensity * 0.6})`,
                              color: intensity > 0.5 ? "white" : "var(--text)",
                            }}
                          >
                            {val || "·"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
      <InsightEditor
        sectionKey="segment_strategy"
        value={insights.segment_strategy || ""}
        onChange={(v) => setInsights({ ...insights, segment_strategy: v })}
        onSave={() => saveInsight("segment_strategy")}
        saving={savingSection === "segment_strategy"}
      />

      {/* Section C — Pricing Analysis */}
      <SectionTitle id="C" title="Pricing Analysis" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5">
          <h4 className="text-[14px] font-semibold text-[var(--text)] mb-3">
            WTP Distribution
          </h4>
          {data.wtpDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <RechartsBarChart data={data.wtpDistribution} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-m)" />
                  <XAxis
                    dataKey="value"
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    label={{ value: "VND (k)", position: "bottom", fontSize: 10, fill: "var(--muted)" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--gray-m)" }} />
                  <Bar dataKey="count" fill="#534AB7" radius={[4, 4, 0, 0]} barSize={24} />
                </RechartsBarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 text-[11px] font-mono text-[var(--muted)]">
                <span>P25: <strong className="text-[var(--text)]">{data.wtpPercentiles.p25}k</strong></span>
                <span>P50: <strong className="text-[var(--text)]">{data.wtpPercentiles.p50}k</strong></span>
                <span>P75: <strong className="text-[var(--text)]">{data.wtpPercentiles.p75}k</strong></span>
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5">
          <h4 className="text-[14px] font-semibold text-[var(--text)] mb-3">
            Tier Recommendation
          </h4>
          <div className="space-y-3">
            {data.pricingTiers.map((tier) => (
              <div
                key={tier.tier}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--gray-m)]"
              >
                <div>
                  <span className="text-[13px] font-medium text-[var(--text)]">{tier.tier}</span>
                  <p className="text-[11px] text-[var(--muted)] font-mono">{tier.range}</p>
                </div>
                <span className="text-[14px] font-serif text-[var(--purple)]">{tier.price}</span>
              </div>
            ))}
          </div>

          <h4 className="text-[14px] font-semibold text-[var(--text)] mt-6 mb-3">
            Competitor Pricing
          </h4>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--gray-m)]">
                <th className="text-left px-2 py-1.5 text-[10px] font-mono text-[var(--muted)] uppercase">Competitor</th>
                <th className="text-left px-2 py-1.5 text-[10px] font-mono text-[var(--muted)] uppercase">Price</th>
                <th className="text-left px-2 py-1.5 text-[10px] font-mono text-[var(--muted)] uppercase">Note</th>
              </tr>
            </thead>
            <tbody>
              {competitorRows.map((row, i) => (
                <tr key={i} className="border-b border-[var(--gray-l)]">
                  <td className="px-2 py-2">
                    <input
                      value={row.name}
                      onChange={(e) => {
                        const next = [...competitorRows];
                        next[i] = { ...next[i], name: e.target.value };
                        setCompetitorRows(next);
                      }}
                      className="text-[12px] text-[var(--text)] bg-transparent border-none outline-none w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.price}
                      onChange={(e) => {
                        const next = [...competitorRows];
                        next[i] = { ...next[i], price: e.target.value };
                        setCompetitorRows(next);
                      }}
                      className="text-[12px] font-mono text-[var(--text)] bg-transparent border-none outline-none w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.note}
                      onChange={(e) => {
                        const next = [...competitorRows];
                        next[i] = { ...next[i], note: e.target.value };
                        setCompetitorRows(next);
                      }}
                      className="text-[12px] text-[var(--muted)] bg-transparent border-none outline-none w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section D — Trust & Conversion */}
      <SectionTitle id="D" title="Trust & Conversion" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5">
          <h4 className="text-[14px] font-semibold text-[var(--text)] mb-3">
            Trust Signals Ranking
          </h4>
          {data.trustSignals.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(240, data.trustSignals.length * 32)}>
              <RechartsBarChart
                data={data.trustSignals}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-m)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--text)" }}
                  width={160}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--gray-m)" }} />
                <Bar dataKey="value" fill="#185FA5" radius={[0, 4, 4, 0]} barSize={18} />
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5">
          <h4 className="text-[14px] font-semibold text-[var(--text)] mb-3">
            Conversion Barriers (Detractor × Factors)
          </h4>
          {data.conversionBarriers.length > 0 ? (
            <div className="space-y-2">
              {data.conversionBarriers.map((b) => {
                const pct = b.totalMentions > 0 ? Math.round((b.detractorCount / b.totalMentions) * 100) : 0;
                return (
                  <div key={b.factor} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[var(--text)] truncate">{b.factor}</p>
                    </div>
                    <div className="w-24 h-2 bg-[var(--gray-l)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#993C1D]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-[var(--muted)] w-10 text-right">
                      {b.detractorCount}/{b.totalMentions}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState />
          )}

          <h4 className="text-[14px] font-semibold text-[var(--text)] mt-6 mb-3">
            <TrendingUp className="inline h-4 w-4 mr-1.5 text-[var(--teal)]" />
            Landing Page Recommendations
          </h4>
          {data.landingPageRecs.length > 0 ? (
            <ol className="space-y-1.5">
              {data.landingPageRecs.map((rec, i) => (
                <li key={rec} className="flex items-start gap-2">
                  <span className="text-[10px] font-mono font-medium text-[var(--purple)] bg-[var(--purple-l)] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-[var(--text)]">{rec}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[12px] text-[var(--muted)] italic">
              Chưa có dữ liệu trust signals
            </p>
          )}
        </div>
      </div>

      {/* Section E — Risk & Gaps */}
      <SectionTitle id="E" title="Risk & Gaps" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5">
          <h4 className="text-[14px] font-semibold text-[var(--text)] mb-3">
            Top 5 Competitive Gaps
          </h4>
          {data.competitiveGaps.length > 0 ? (
            <div className="space-y-2.5">
              {data.competitiveGaps.map((g) => (
                <div key={g.gap} className="flex items-center gap-3">
                  <span className="text-[11px] font-mono font-bold text-[#993C1D] bg-[#FAECE7] w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {g.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[var(--text)]">{g.gap}</p>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--muted)]">{g.count}×</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5">
          <h4 className="text-[14px] font-semibold text-[var(--text)] mb-3">
            Dropout Risk × Segment
          </h4>
          {data.dropoutRisks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1 text-[10px] font-mono text-[var(--muted)]">Trigger</th>
                    {data.dropoutSegments.map((seg) => (
                      <th key={seg} className="text-center px-2 py-1 text-[10px] font-mono text-[var(--muted)]">
                        {SEGMENT_LABELS[seg] || seg}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.dropoutRisks.map((risk) => (
                    <tr key={risk.trigger} className="border-b border-[var(--gray-l)]">
                      <td className="px-2 py-1.5 text-[11px] text-[var(--text)] max-w-[160px] truncate">
                        {risk.trigger}
                      </td>
                      {data.dropoutSegments.map((seg) => (
                        <td key={seg} className="text-center px-2 py-1.5 text-[11px] font-mono text-[var(--muted)]">
                          {risk.segments[seg] || "·"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
      <InsightEditor
        sectionKey="risk_gaps"
        value={insights.risk_gaps || ""}
        onChange={(v) => setInsights({ ...insights, risk_gaps: v })}
        onSave={() => saveInsight("risk_gaps")}
        saving={savingSection === "risk_gaps"}
      />

      {/* Section F — Qualitative Signals */}
      <SectionTitle id="F" title="Qualitative Signals" />
      <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5 mb-8">
        <h4 className="text-[14px] font-semibold text-[var(--text)] mb-4">
          <Star className="inline h-4 w-4 mr-1.5 text-[#EF9F27]" />
          Notable Session Notes
        </h4>
        {data.notableNotes.length > 0 ? (
          <div className="space-y-3">
            {data.notableNotes.map((note) => (
              <div
                key={note.id}
                className="border border-[var(--gray-m)] rounded-lg p-4 hover:bg-[var(--gray-l)]/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[var(--text)]">
                      {note.respondentName}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--gray-l)] px-1.5 py-0.5 rounded-md">
                      {SEGMENT_LABELS[note.respondentType] || note.respondentType}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--purple)] bg-[var(--purple-l)] px-1.5 py-0.5 rounded-md">
                      {note.sectionKey}
                    </span>
                  </div>
                  {note.sentiment && SENTIMENT_STYLES[note.sentiment] && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                      style={{
                        background: SENTIMENT_STYLES[note.sentiment].bg,
                        color: SENTIMENT_STYLES[note.sentiment].color,
                      }}
                    >
                      {SENTIMENT_STYLES[note.sentiment].label}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--text)] leading-relaxed">
                  <MessageSquare className="inline h-3 w-3 mr-1 text-[var(--muted)]" />
                  {note.noteText}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[12px] text-[var(--muted)] italic">
              Chưa có ghi chú nào được đánh dấu &quot;notable&quot;.
              <br />
              Đánh dấu từ Admin → Sessions → Session detail.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function SectionTitle({ id, title }: { id: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-6">
      <span className="text-[11px] font-mono font-semibold text-[var(--purple)] bg-[var(--purple-l)] px-2 py-0.5 rounded-md">
        Section {id}
      </span>
      <h3 className="font-serif text-[18px] text-[var(--text)]">{title}</h3>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <p className="text-[12px] text-[var(--muted)] italic">
        Chưa đủ dữ liệu
      </p>
    </div>
  );
}

function InsightEditor({
  sectionKey,
  value,
  onChange,
  onSave,
  saving,
}: {
  sectionKey: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-white border border-[var(--gray-m)] rounded-lg p-5 mb-8">
      <h4 className="text-[14px] font-semibold text-[var(--text)] mb-2">
        Admin Insight — {sectionKey.replace("_", " ")}
      </h4>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ghi nhận xét phân tích, đề xuất chiến lược..."
        className="w-full border border-[var(--gray-m)] rounded-lg p-3 font-sans text-[13px] text-[var(--text)] bg-white resize-y min-h-[80px] outline-none focus:border-[var(--purple)] focus:shadow-[0_0_0_3px_rgba(83,74,183,0.08)] transition-colors"
      />
      <div className="flex justify-end mt-2">
        <Button
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[12px]"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          {saving ? "Đang lưu..." : "Lưu insight"}
        </Button>
      </div>
    </div>
  );
}
