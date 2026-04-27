"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  isEmpty?: boolean;
  loading?: boolean;
}

export function ChartCard({
  id,
  title,
  subtitle,
  children,
  isEmpty = false,
  loading = false,
}: ChartCardProps) {
  return (
    <div
      id={id}
      className="bg-[var(--white)] border border-[var(--gray-m)] rounded-lg p-5"
    >
      <div className="mb-4">
        <h4 className="text-[14px] font-semibold text-[var(--text)]">
          <span className="font-mono text-[11px] text-[var(--muted)] mr-2">
            {id.toUpperCase()}
          </span>
          {title}
        </h4>
        {subtitle && (
          <p className="text-[11px] text-[var(--muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ) : isEmpty ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-[12px] text-[var(--muted)] italic">
            Cần ít nhất 5 responses để hiển thị biểu đồ
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
