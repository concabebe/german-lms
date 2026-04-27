"use client";

import type { SectionDef } from "@/lib/questions/types";

interface SectionTabsProps {
  sections: Record<string, SectionDef>;
  activeSection: string;
  completedSections: Set<string>;
  onTabClick: (sectionKey: string) => void;
}

export function SectionTabs({
  sections,
  activeSection,
  completedSections,
  onTabClick,
}: SectionTabsProps) {
  const sectionEntries = Object.entries(sections);

  return (
    <div className="flex gap-0 border-b-2 border-[var(--gray-m)] mb-6 overflow-x-auto scrollbar-none">
      {sectionEntries.map(([key, section]) => {
        const isActive = activeSection === key;
        const isDone = completedSections.has(key);

        return (
          <button
            key={key}
            type="button"
            onClick={() => onTabClick(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium cursor-pointer border-none bg-transparent border-b-[3px] -mb-[2px] whitespace-nowrap transition-all font-sans relative ${
              isActive
                ? "text-[var(--text)] font-semibold border-b-[var(--text)]"
                : "text-[var(--muted)] border-b-transparent hover:text-[var(--text)]"
            }`}
          >
            <span
              className={`w-[7px] h-[7px] rounded-full shrink-0 transition-opacity ${
                isActive ? "opacity-100" : "opacity-40"
              }`}
              style={{ background: section.color }}
            />
            <span>{section.title}</span>

            {isDone ? (
              <span className="w-3.5 h-3.5 rounded-full bg-[#1D9E75] flex items-center justify-center shrink-0">
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path
                    d="M1.5 4L3.5 6L6.5 2"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </span>
            ) : (
              <span
                className={`text-[10px] px-1.5 py-px rounded-[10px] font-mono transition-all ${
                  isActive
                    ? "text-white"
                    : "bg-[var(--gray-l)] text-[var(--muted)]"
                }`}
                style={isActive ? { background: section.color } : undefined}
              >
                {section.keys.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
