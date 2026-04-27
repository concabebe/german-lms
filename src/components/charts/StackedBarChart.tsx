"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { GroupedChartDataPoint } from "@/lib/utils/aggregation";

const COLORS = ["#534AB7", "#0F6E56", "#993C1D", "#185FA5", "#854F0B", "#6B6560"];

interface StackedBarChartProps {
  data: GroupedChartDataPoint[];
  height?: number;
  grouped?: boolean;
}

export function StackedBarChart({
  data,
  height = 300,
  grouped = false,
}: StackedBarChartProps) {
  if (data.length === 0) return null;

  const allKeys = new Set<string>();
  for (const d of data) {
    for (const key of Object.keys(d)) {
      if (key !== "name") allKeys.add(key);
    }
  }
  const segmentKeys = Array.from(allKeys);

  const chartHeight = Math.max(height, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-m)" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fill: "var(--text)" }}
          width={160}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid var(--gray-m)",
          }}
        />
        <Legend
          verticalAlign="top"
          height={36}
          iconSize={10}
          formatter={(value: string) => (
            <span style={{ fontSize: 11, color: "var(--text)" }}>{value}</span>
          )}
        />
        {segmentKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId={grouped ? undefined : "stack"}
            fill={COLORS[i % COLORS.length]}
            barSize={grouped ? 12 : 20}
            radius={grouped ? [0, 4, 4, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
