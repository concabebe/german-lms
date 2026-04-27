"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChartCard } from "@/components/charts/ChartCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChartComponent } from "@/components/charts/BarChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import type { InsightsData } from "@/lib/utils/aggregation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Filter, Download } from "lucide-react";

interface InsightsContentProps {
  data: InsightsData;
  isAdmin: boolean;
  interviewers: { id: string; name: string }[];
  currentFilters: {
    dateFrom?: string;
    dateTo?: string;
    respondentType?: string;
    interviewerId?: string;
  };
}

const SEGMENT_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "learner", label: "Người học" },
  { value: "teacher", label: "Giáo viên" },
  { value: "parent", label: "Phụ huynh" },
  { value: "counselor", label: "Tư vấn viên" },
  { value: "cultural_official", label: "Cán bộ văn hoá" },
];

const MIN_DATA_THRESHOLD = 5;

export function InsightsContent({
  data,
  isAdmin,
  interviewers,
  currentFilters,
}: InsightsContentProps) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom || "");
  const [dateTo, setDateTo] = useState(currentFilters.dateTo || "");
  const [respondentType, setRespondentType] = useState(
    currentFilters.respondentType || ""
  );
  const [interviewerId, setInterviewerId] = useState(
    currentFilters.interviewerId || ""
  );

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (respondentType) params.set("respondentType", respondentType);
    if (interviewerId) params.set("interviewerId", interviewerId);
    router.push(`/insights${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setRespondentType("");
    setInterviewerId("");
    router.push("/insights");
  };

  const hasFilters = dateFrom || dateTo || respondentType || interviewerId;
  const lowData = data.kpi.totalSessions < MIN_DATA_THRESHOLD;

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-[28px] text-[var(--text)] mb-1">
            Insights Dashboard
          </h2>
          <p className="text-[13px] text-[var(--muted)]">
            Phân tích dữ liệu từ {data.kpi.totalSessions} phiên interview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`text-[12px] border-[var(--gray-m)] ${
              hasFilters ? "text-[var(--purple)] border-[var(--purple)]" : "text-[var(--muted)]"
            }`}
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Bộ lọc
            {hasFilters && (
              <span className="ml-1.5 w-4 h-4 rounded-full bg-[var(--purple)] text-white text-[9px] flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono block mb-1.5">
                Từ ngày
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-[12px] border-[var(--gray-m)]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono block mb-1.5">
                Đến ngày
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-[12px] border-[var(--gray-m)]"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono block mb-1.5">
                Nhóm respondent
              </label>
              <div className="relative">
                <select
                  value={respondentType}
                  onChange={(e) => setRespondentType(e.target.value)}
                  className="w-full border border-[var(--gray-m)] rounded-lg py-2 px-3 text-[12px] text-[var(--text)] bg-[var(--white)] appearance-none pr-8 outline-none focus:border-[var(--purple)]"
                >
                  {SEGMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)] pointer-events-none" />
              </div>
            </div>
            {isAdmin && (
              <div>
                <label className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] font-mono block mb-1.5">
                  Interviewer
                </label>
                <div className="relative">
                  <select
                    value={interviewerId}
                    onChange={(e) => setInterviewerId(e.target.value)}
                    className="w-full border border-[var(--gray-m)] rounded-lg py-2 px-3 text-[12px] text-[var(--text)] bg-[var(--white)] appearance-none pr-8 outline-none focus:border-[var(--purple)]"
                  >
                    <option value="">Tất cả</option>
                    {interviewers.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)] pointer-events-none" />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              onClick={applyFilters}
              className="bg-[var(--purple)] hover:bg-[#4740A3] text-white text-[12px]"
            >
              Áp dụng
            </Button>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-[12px] border-[var(--gray-m)] text-[var(--muted)]"
              >
                Xoá bộ lọc
              </Button>
            )}
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KPICard
          label="Tổng phiên"
          value={String(data.kpi.totalSessions)}
          color="var(--purple)"
        />
        <KPICard
          label="Respondents"
          value={String(data.kpi.totalRespondents)}
          color="var(--teal)"
        />
        <KPICard
          label="Top Segment"
          value={data.kpi.topSegment}
          color="var(--blue)"
          small
        />
        <KPICard
          label="Avg WTP"
          value={`${data.kpi.avgWTP}k`}
          color="var(--amber)"
        />
        <KPICard
          label="NPS Score"
          value={String(data.kpi.npsScore)}
          color={data.kpi.npsScore >= 0 ? "var(--teal)" : "var(--coral)"}
        />
        <KPICard
          label="% Deadline"
          value={`${data.kpi.pctWithDeadline}%`}
          color="var(--purple)"
        />
      </div>

      {/* Section A — Segment & Demographics */}
      <SectionHeader id="A" title="Segment & Demographics" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ChartCard id="a1" title="Respondent type distribution" isEmpty={lowData}>
          <DonutChart data={data.a1} />
        </ChartCard>
        <ChartCard id="a2" title="Current level" subtitle="S3" isEmpty={lowData}>
          <BarChartComponent data={data.a2} color="#534AB7" />
        </ChartCard>
        <ChartCard id="a3" title="Learning goals" subtitle="S1" isEmpty={lowData}>
          <BarChartComponent data={data.a3} color="#0F6E56" layout="vertical" />
        </ChartCard>
        <ChartCard id="a4" title="Respondents by location" isEmpty={lowData}>
          <BarChartComponent data={data.a4} color="#185FA5" />
        </ChartCard>
        <ChartCard id="a5" title="Gender distribution" isEmpty={lowData}>
          <DonutChart data={data.a5} />
        </ChartCard>
      </div>

      {/* Section B — Learning Behavior */}
      <SectionHeader id="B" title="Learning Behavior" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ChartCard id="b1" title="Main device" subtitle="B5" isEmpty={lowData}>
          <DonutChart data={data.b1} />
        </ChartCard>
        <ChartCard id="b2" title="Preferred learning style" subtitle="B6" isEmpty={lowData}>
          <BarChartComponent data={data.b2} color="#534AB7" />
        </ChartCard>
        <ChartCard id="b3" title="Study time of day" subtitle="B4" isEmpty={lowData}>
          <BarChartComponent data={data.b3} color="#0F6E56" />
        </ChartCard>
        <ChartCard id="b4" title="Hours/week" subtitle="B3" isEmpty={lowData}>
          <BarChartComponent data={data.b4} color="#185FA5" />
        </ChartCard>
      </div>

      {/* Section C — Pain Points */}
      <SectionHeader id="C" title="Pain Points" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ChartCard id="c1" title="Pain frequency sorted" subtitle="P1" isEmpty={lowData}>
          <BarChartComponent data={data.c1} color="#993C1D" layout="vertical" />
        </ChartCard>
        <ChartCard id="c2" title="Dropout triggers" subtitle="P2" isEmpty={lowData}>
          <BarChartComponent data={data.c2} color="#854F0B" layout="vertical" />
        </ChartCard>
        <ChartCard id="c3" title="Competitive gaps" subtitle="P4" isEmpty={lowData}>
          <BarChartComponent data={data.c3} color="#185FA5" layout="vertical" />
        </ChartCard>
      </div>

      {/* Section D — Feature Priority */}
      <SectionHeader id="D" title="Feature Priority" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ChartCard id="d1" title="Feature priority overall" subtitle="K2" isEmpty={lowData}>
          <BarChartComponent data={data.d1} color="#534AB7" layout="vertical" />
        </ChartCard>
        <ChartCard id="d2" title="Feature priority by segment" subtitle="K2 × S2" isEmpty={lowData}>
          <StackedBarChart data={data.d2} />
        </ChartCard>
        <ChartCard id="d3" title="Learning path preference" subtitle="B7" isEmpty={lowData}>
          <DonutChart data={data.d3} />
        </ChartCard>
        <ChartCard id="d4" title="UI language preference" subtitle="K5" isEmpty={lowData}>
          <DonutChart data={data.d4} />
        </ChartCard>
      </div>

      {/* Section E — WTP & Revenue */}
      <SectionHeader id="E" title="WTP & Revenue" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ChartCard id="e1" title="WTP by segment" subtitle="T2 × S2" isEmpty={lowData}>
          <StackedBarChart data={data.e1} grouped />
        </ChartCard>
        <ChartCard id="e2" title="Payment model" subtitle="T3" isEmpty={lowData}>
          <BarChartComponent data={data.e2} color="#0F6E56" />
        </ChartCard>
        <ChartCard id="e3" title="Purchase decision factors" subtitle="T4" isEmpty={lowData}>
          <BarChartComponent data={data.e3} color="#854F0B" layout="vertical" />
        </ChartCard>
      </div>

      {/* Section F — NPS & Trust */}
      <SectionHeader id="F" title="NPS & Trust" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ChartCard id="f1" title="NPS distribution" subtitle="T6" isEmpty={lowData}>
          <DonutChart data={data.f1} />
        </ChartCard>
        <ChartCard id="f2" title="Trust signals ranked" subtitle="T5" isEmpty={lowData}>
          <BarChartComponent data={data.f2} color="#185FA5" layout="vertical" />
        </ChartCard>
      </div>

      {/* Section G — Note Insights (Admin only) */}
      {isAdmin && (
        <>
          <SectionHeader id="G" title="Note Insights" adminOnly />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <ChartCard id="g1" title="Sentiment overview" isEmpty={lowData}>
              <DonutChart data={data.g1} />
            </ChartCard>
            <ChartCard id="g2" title="Most tagged questions" isEmpty={lowData}>
              <BarChartComponent data={data.g2} color="#854F0B" />
            </ChartCard>
            <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-5">
              <h4 className="text-[14px] font-semibold text-[var(--text)] mb-4">
                <span className="font-mono text-[11px] text-[var(--muted)] mr-2">
                  G3
                </span>
                Note coverage rate
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-[28px] font-serif text-[var(--purple)]">
                    {data.g3.totalSections}
                  </div>
                  <div className="text-[11px] text-[var(--muted)] font-mono uppercase">
                    Total sections
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[28px] font-serif text-[var(--teal)]">
                    {data.g3.withNotes}
                  </div>
                  <div className="text-[11px] text-[var(--muted)] font-mono uppercase">
                    With notes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[28px] font-serif text-[var(--amber)]">
                    {data.g3.rate}%
                  </div>
                  <div className="text-[11px] text-[var(--muted)] font-mono uppercase">
                    Coverage
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-5 flex items-center justify-center">
              <Button
                disabled
                variant="outline"
                className="text-[12px] text-[var(--muted)] border-[var(--gray-m)]"
                title="Coming in v2"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                AI Export
              </Button>
              <span className="ml-3 text-[11px] text-[var(--muted)] italic">
                Coming in v2
              </span>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function KPICard({
  label,
  value,
  color,
  small = false,
}: {
  label: string;
  value: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg px-4 py-4">
      <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--muted)] mb-1">
        {label}
      </div>
      <div
        className={`font-serif ${small ? "text-[18px]" : "text-[28px]"}`}
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  id,
  title,
  adminOnly = false,
}: {
  id: string;
  title: string;
  adminOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <span className="text-[11px] font-mono font-semibold text-[var(--purple)] bg-[var(--purple-l)] px-2 py-0.5 rounded-md">
        Section {id}
      </span>
      <h3 className="font-serif text-[18px] text-[var(--text)]">{title}</h3>
      {adminOnly && (
        <span className="text-[9px] font-mono uppercase text-[var(--coral)] bg-[var(--coral-l)] px-1.5 py-0.5 rounded-md">
          Admin
        </span>
      )}
    </div>
  );
}
