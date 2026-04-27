"use client";

import type { SectionDef } from "@/lib/questions/types";
import type { Json } from "@/types/database";
import { getQuestionsForSection } from "@/lib/questions/data";
import { QuestionCard } from "./QuestionCard";
import { NotePanel } from "./NotePanel";

interface SectionViewProps {
  groupKey: string;
  sectionKey: string;
  section: SectionDef;
  responses: Record<string, Json>;
  notes: Record<string, { text: string; tags: string[]; sentiment: string | null }>;
  groupVariant: string;
  onResponseChange: (key: string, value: Json) => void;
  onNoteSave: (
    sectionKey: string,
    noteText: string,
    taggedQuestions: string[],
    sentimentHint: string | null
  ) => void;
}

export function SectionView({
  groupKey,
  sectionKey,
  section,
  responses,
  notes,
  groupVariant,
  onResponseChange,
  onNoteSave,
}: SectionViewProps) {
  const questions = getQuestionsForSection(groupKey, sectionKey);
  const noteData = notes[sectionKey];

  return (
    <div>
      <div
        className="text-[11px] font-semibold tracking-[0.1em] uppercase py-1.5 px-3 rounded-md mb-4 inline-block"
        style={{ background: section.bg, color: section.color }}
      >
        {section.title} — {section.subtitle}
      </div>

      {questions.map((question) => (
        <QuestionCard
          key={question.key}
          question={question}
          value={responses[question.key]}
          groupVariant={groupVariant}
          sectionColor={section.color}
          sectionBg={section.bg}
          onChange={onResponseChange}
        />
      ))}

      <NotePanel
        sectionKey={sectionKey}
        sectionLabel={`Section ${sectionKey.split("-")[0]} (${section.title.split(" · ")[1] || section.title})`}
        questionKeys={section.keys}
        initialNote={noteData?.text || ""}
        initialTags={noteData?.tags || []}
        initialSentiment={noteData?.sentiment || null}
        onSave={onNoteSave}
      />
    </div>
  );
}
