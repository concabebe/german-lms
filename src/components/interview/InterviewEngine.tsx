"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { Json } from "@/types/database";
import type { GroupKey } from "@/lib/questions/types";
import {
  GROUP_DEFS,
  RESPONDENT_TYPE_TO_GROUPS,
} from "@/lib/questions/types";
import { SECTIONS, QUESTIONS } from "@/lib/questions/data";
import { SectionTabs } from "./SectionTabs";
import { SectionView } from "./SectionView";
import { SaveIndicator } from "./SaveIndicator";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import { createClient } from "@/lib/supabase/client";

interface InterviewEngineProps {
  sessionId: string;
  respondentType: string;
  initialResponses?: Record<string, Json>;
  initialNotes?: Record<
    string,
    { text: string; tags: string[]; sentiment: string | null }
  >;
}

export function InterviewEngine({
  sessionId,
  respondentType,
  initialResponses = {},
  initialNotes = {},
}: InterviewEngineProps) {
  const [responses, setResponses] =
    useState<Record<string, Json>>(initialResponses);
  const [notes, setNotes] = useState(initialNotes);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeSections, setActiveSections] = useState<Record<string, string>>(
    {}
  );

  const autoSave = useAutoSave(sessionId);

  const groups = useMemo(() => {
    const groupKeys =
      RESPONDENT_TYPE_TO_GROUPS[respondentType] || (["lrn"] as GroupKey[]);
    return GROUP_DEFS.filter((g) => groupKeys.includes(g.key));
  }, [respondentType]);

  const activeGroup = groups[activeGroupIndex];
  const groupSections = useMemo(
    () => SECTIONS[activeGroup?.key] || {},
    [activeGroup?.key]
  );
  const sectionKeys = Object.keys(groupSections);

  const activeSection =
    activeSections[activeGroup?.key] || sectionKeys[0] || "";

  const setActiveSection = useCallback(
    (sectionKey: string) => {
      setActiveSections((prev) => ({
        ...prev,
        [activeGroup.key]: sectionKey,
      }));
    },
    [activeGroup]
  );

  const handleResponseChange = useCallback(
    (key: string, value: Json) => {
      setResponses((prev) => ({ ...prev, [key]: value }));
      autoSave.saveResponse(key, value);
    },
    [autoSave]
  );

  const handleNoteSave = useCallback(
    (
      sectionKey: string,
      noteText: string,
      taggedQuestions: string[],
      sentimentHint: string | null
    ) => {
      setNotes((prev) => ({
        ...prev,
        [sectionKey]: {
          text: noteText,
          tags: taggedQuestions,
          sentiment: sentimentHint,
        },
      }));
      autoSave.saveNote(sectionKey, noteText, taggedQuestions, sentimentHint);
    },
    [autoSave]
  );

  // Progress calculation
  const { answered, total } = useMemo(() => {
    let totalCount = 0;
    let answeredCount = 0;

    groups.forEach((group) => {
      const sections = SECTIONS[group.key] || {};
      Object.values(sections).forEach((section) => {
        section.keys.forEach((key) => {
          const q = QUESTIONS[key];
          if (!q) return;
          totalCount++;
          const val = responses[key];
          if (val !== undefined && val !== null && val !== "") {
            if (Array.isArray(val) && val.length === 0) return;
            answeredCount++;
          }
        });
      });
    });

    return { answered: answeredCount, total: totalCount };
  }, [responses, groups]);

  const progressPct = total > 0 ? Math.round((answered / total) * 100) : 0;

  // Step dots for LRN
  const currentSectionIndex = sectionKeys.indexOf(activeSection);

  // Completed sections
  const completedSections = useMemo(() => {
    const completed = new Set<string>();
    Object.entries(groupSections).forEach(([key, section]) => {
      const allAnswered = section.keys.every((qKey) => {
        const val = responses[qKey];
        if (val === undefined || val === null || val === "") return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
      });
      if (allAnswered) completed.add(key);
    });
    return completed;
  }, [groupSections, responses]);

  // Load existing responses from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      const [responsesRes, notesRes] = await Promise.all([
        supabase
          .from("responses")
          .select("question_key, answer_value")
          .eq("session_id", sessionId),
        supabase
          .from("session_notes")
          .select("section_key, note_text, tagged_questions, sentiment_hint")
          .eq("session_id", sessionId),
      ]);

      if (responsesRes.data) {
        const loaded: Record<string, Json> = {};
        responsesRes.data.forEach((r) => {
          loaded[r.question_key] = r.answer_value;
        });
        setResponses((prev) => ({ ...loaded, ...prev }));
      }

      if (notesRes.data) {
        const loadedNotes: Record<
          string,
          { text: string; tags: string[]; sentiment: string | null }
        > = {};
        notesRes.data.forEach((n) => {
          loadedNotes[n.section_key] = {
            text: n.note_text,
            tags: n.tagged_questions || [],
            sentiment: n.sentiment_hint,
          };
        });
        setNotes((prev) => ({ ...loadedNotes, ...prev }));
      }
    };

    loadData();
  }, [sessionId]);

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setActiveSection(sectionKeys[currentSectionIndex - 1]);
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < sectionKeys.length - 1) {
      setActiveSection(sectionKeys[currentSectionIndex + 1]);
    }
  };

  if (!activeGroup) return null;

  const isLrn = activeGroup.key === "lrn";

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-screen">
      {/* Sidebar */}
      <aside className="bg-[var(--white)] border-r border-[var(--gray-m)] py-7 sticky top-0 h-screen overflow-y-auto hidden md:flex flex-col">
        <div className="px-6 pb-6 border-b border-[var(--gray-m)] mb-5">
          <div className="font-serif text-[17px] text-[var(--text)] leading-[1.3]">
            Interview Form
            <br />
            LMS Tiếng Đức
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-[3px] font-mono uppercase tracking-[0.06em]">
            User Research · v1.2
          </div>
        </div>

        <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--muted)] px-6 pb-2">
          Nhóm đối tượng
        </div>

        {groups.map((group, idx) => {
          const isActive = idx === activeGroupIndex;
          const variantClass = isActive ? `active ${group.key}` : "";

          let bgClass = "";
          let textClass = "";
          let borderClass = "";

          if (isActive) {
            switch (group.key) {
              case "lrn":
                bgClass = "bg-[#E1F5EE]";
                textClass = "text-[#0F6E56]";
                borderClass = "border-l-[#0F6E56]";
                break;
              case "tch":
                bgClass = "bg-[var(--teal-l)]";
                textClass = "text-[var(--teal)]";
                borderClass = "border-l-[var(--teal)]";
                break;
              case "par":
                bgClass = "bg-[var(--coral-l)]";
                textClass = "text-[var(--coral)]";
                borderClass = "border-l-[var(--coral)]";
                break;
              case "cns":
                bgClass = "bg-[var(--blue-l)]";
                textClass = "text-[var(--blue)]";
                borderClass = "border-l-[var(--blue)]";
                break;
              case "clt":
                bgClass = "bg-[var(--amber-l)]";
                textClass = "text-[var(--amber)]";
                borderClass = "border-l-[var(--amber)]";
                break;
              default:
                bgClass = "bg-[var(--purple-l)]";
                textClass = "text-[var(--purple)]";
                borderClass = "border-l-[var(--purple)]";
            }
          }

          return (
            <button
              key={group.key}
              type="button"
              data-variant={variantClass}
              onClick={() => setActiveGroupIndex(idx)}
              className={`flex items-center gap-2.5 py-2.5 px-6 cursor-pointer border-none w-full text-left font-sans text-[13px] transition-all border-l-[3px] ${
                isActive
                  ? `${bgClass} ${textClass} ${borderClass} font-medium`
                  : "bg-transparent text-[var(--muted)] border-l-transparent hover:bg-[var(--gray-l)] hover:text-[var(--text)]"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: group.dotColor }}
              />
              <span>{group.label}</span>
              <span
                className={`ml-auto text-[10px] font-mono px-1.5 py-px rounded-full ${
                  isActive ? "bg-black/[.08]" : "bg-[var(--gray-m)]"
                }`}
              >
                {group.questionCount}
              </span>
            </button>
          );
        })}

        {/* Progress */}
        <div className="mt-auto pt-5 px-6 border-t border-[var(--gray-m)]">
          <div className="text-[11px] text-[var(--muted)] mb-2">
            Tiến độ phiên này
          </div>
          <div className="bg-[var(--gray-m)] rounded h-[5px]">
            <div
              className="bg-[var(--purple)] h-[5px] rounded transition-[width] duration-400 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-xs font-medium text-[var(--purple)] mt-[5px]">
            {answered} / {total} câu đã điền
          </div>
          <div className="mt-2">
            <SaveIndicator
              status={autoSave.status}
              lastSavedAt={autoSave.lastSavedAt}
              onRetry={autoSave.retry}
            />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="py-6 px-4 md:py-10 md:px-12 max-w-[820px]">
        {/* Group header */}
        <div className="mb-8 pb-6 border-b border-[var(--gray-m)]">
          <div
            className="text-[11px] font-mono tracking-[0.1em] uppercase mb-2"
            style={{ color: activeGroup.dotColor }}
          >
            {activeGroup.eyebrow}
          </div>
          <h1 className="font-serif text-[28px] leading-[1.2] mb-2">
            {activeGroup.title}
          </h1>
          <p className="text-[13px] text-[var(--muted)] max-w-[560px]">
            {activeGroup.description}
          </p>
        </div>

        {/* Step dots for LRN */}
        {isLrn && (
          <div className="flex items-center gap-2.5 mb-5 text-[11px] text-[var(--muted)]">
            <div className="flex gap-1">
              {sectionKeys.map((key, idx) => (
                <div
                  key={key}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentSectionIndex
                      ? "bg-[#1D9E75] scale-[1.3]"
                      : idx < currentSectionIndex ||
                          completedSections.has(key)
                        ? "bg-[#1D9E75]"
                        : "bg-[var(--gray-m)]"
                  }`}
                />
              ))}
            </div>
            <span className="font-mono">
              {groupSections[activeSection]?.title || activeSection}
            </span>
          </div>
        )}

        {/* Section tabs (LRN only) */}
        {isLrn && (
          <SectionTabs
            sections={groupSections}
            activeSection={activeSection}
            completedSections={completedSections}
            onTabClick={setActiveSection}
          />
        )}

        {/* Section content */}
        {sectionKeys.map((sectionKey) => {
          const isVisible = isLrn
            ? sectionKey === activeSection
            : true;
          if (!isVisible) return null;

          return (
            <SectionView
              key={sectionKey}
              groupKey={activeGroup.key}
              sectionKey={sectionKey}
              section={groupSections[sectionKey]}
              responses={responses}
              notes={notes}
              groupVariant={activeGroup.key}
              onResponseChange={handleResponseChange}
              onNoteSave={handleNoteSave}
            />
          );
        })}

        {/* Section navigation (LRN) */}
        {isLrn && (
          <div className="flex justify-between items-center mt-6 pt-5 border-t border-[var(--gray-m)]">
            {currentSectionIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevSection}
                className="font-sans text-[13px] font-medium py-2 px-5 rounded-lg cursor-pointer transition-all bg-[var(--gray-l)] text-[var(--muted)] border border-[var(--gray-m)] hover:bg-[var(--gray-m)] hover:text-[var(--text)]"
              >
                ← {groupSections[sectionKeys[currentSectionIndex - 1]]?.title.split(" · ")[0]}
              </button>
            ) : (
              <span />
            )}
            <span className="text-[11px] text-[var(--muted)] font-mono">
              {currentSectionIndex + 1} / {sectionKeys.length}
            </span>
            {currentSectionIndex < sectionKeys.length - 1 ? (
              <button
                type="button"
                onClick={handleNextSection}
                className="font-sans text-[13px] font-medium py-2 px-5 rounded-lg cursor-pointer transition-all bg-[#1D9E75] text-white border border-[#1D9E75] hover:bg-[#0F6E56]"
              >
                {groupSections[sectionKeys[currentSectionIndex + 1]]?.title.split(" · ")[0]} →
              </button>
            ) : null}
          </div>
        )}

        {/* Group navigation (non-LRN) */}
        {!isLrn && groups.length > 1 && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[var(--gray-m)]">
            {activeGroupIndex > 0 ? (
              <button
                type="button"
                onClick={() => setActiveGroupIndex(activeGroupIndex - 1)}
                className="font-sans text-sm font-medium py-2.5 px-6 rounded-lg cursor-pointer transition-all bg-[var(--gray-l)] text-[var(--muted)] border border-[var(--gray-m)] hover:bg-[var(--gray-m)] hover:text-[var(--text)]"
              >
                ← Quay lại
              </button>
            ) : (
              <span />
            )}
            <span className="text-xs text-[var(--muted)] font-mono">
              {activeGroupIndex + 1} / {groups.length}
            </span>
            {activeGroupIndex < groups.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveGroupIndex(activeGroupIndex + 1)}
                className="font-sans text-sm font-medium py-2.5 px-6 rounded-lg cursor-pointer transition-all text-white border-none hover:opacity-90"
                style={{ background: groups[activeGroupIndex + 1]?.dotColor || "var(--purple)" }}
              >
                {groups[activeGroupIndex + 1]?.label.split(" — ")[0]} →
              </button>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
