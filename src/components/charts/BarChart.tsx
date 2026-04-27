"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ChartDataPoint } from "@/lib/utils/aggregation";

interface BarChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  layout?: "vertical" | "horizontal";
}

export function BarChartComponent({
  data,
  color = "#534AB7",
  height = 260,
  layout = "horizontal",
}: BarChartProps) {
  if (layout === "vertical") {
    const chartHeight = Math.max(height, data.length * 36);
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsBarChart
          data={data}
          layout="vertical"
          margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-m)" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--text)" }}
            width={180}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--gray-m)",
            }}
          />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={20} />
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-m)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "var(--muted)" }}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid var(--gray-m)",
          }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} barSize={28} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
