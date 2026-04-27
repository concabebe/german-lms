"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartDataPoint } from "@/lib/utils/aggregation";

const COLORS = ["#534AB7", "#0F6E56", "#993C1D", "#185FA5", "#854F0B", "#6B6560", "#8B5CF6", "#D97706"];

interface DonutChartProps {
  data: ChartDataPoint[];
  height?: number;
}

export function DonutChart({ data, height = 260 }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={entry.fill || COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            fontSize: 12,
            fontFamily: "var(--font-sans)",
            borderRadius: 8,
            border: "1px solid var(--gray-m)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconSize={10}
          formatter={(value: string) => (
            <span style={{ fontSize: 11, color: "var(--text)" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
