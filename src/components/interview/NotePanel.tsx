"use client";

import { useState, useCallback } from "react";

interface NotePanelProps {
  sectionKey: string;
  sectionLabel: string;
  questionKeys: string[];
  initialNote?: string;
  initialTags?: string[];
  initialSentiment?: string | null;
  onSave: (
    sectionKey: string,
    noteText: string,
    taggedQuestions: string[],
    sentimentHint: string | null
  ) => void;
}

type Sentiment = "positive" | "negative" | "neutral" | "uncertain";

const SENTIMENT_OPTIONS: {
  key: Sentiment;
  label: string;
  activeClass: string;
}[] = [
  {
    key: "positive",
    label: "Tích cực",
    activeClass: "!bg-[var(--teal-l)] !text-[var(--teal)] !border-[var(--teal)]",
  },
  {
    key: "negative",
    label: "Tiêu cực",
    activeClass:
      "!bg-[var(--coral-l)] !text-[var(--coral)] !border-[var(--coral)]",
  },
  {
    key: "neutral",
    label: "Trung lập",
    activeClass: "!bg-[var(--blue-l)] !text-[var(--blue)] !border-[var(--blue)]",
  },
  {
    key: "uncertain",
    label: "Không chắc",
    activeClass:
      "!bg-[var(--amber-l)] !text-[var(--amber)] !border-[var(--amber)]",
  },
];

export function NotePanel({
  sectionKey,
  sectionLabel,
  questionKeys,
  initialNote = "",
  initialTags = [],
  initialSentiment = null,
  onSave,
}: NotePanelProps) {
  const [noteText, setNoteText] = useState(initialNote);
  const [taggedQuestions, setTaggedQuestions] = useState<string[]>(initialTags);
  const [sentiment, setSentiment] = useState<string | null>(initialSentiment);
  const [charCount, setCharCount] = useState(initialNote.length);

  const handleBlur = useCallback(() => {
    if (noteText.trim() || taggedQuestions.length > 0 || sentiment) {
      onSave(sectionKey, noteText, taggedQuestions, sentiment);
    }
  }, [sectionKey, noteText, taggedQuestions, sentiment, onSave]);

  const toggleTag = (key: string) => {
    setTaggedQuestions((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const toggleSentiment = (key: string) => {
    setSentiment((prev) => (prev === key ? null : key));
  };

  return (
    <div className="bg-[var(--amber-l)] rounded-[10px] p-4 px-[18px] my-2 mb-6 border-l-[3px] border-l-[#EF9F27]">
      <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--amber)] mb-2 flex items-center gap-1.5">
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 14 14"
          fill="none"
        >
          <rect
            x="2"
            y="1"
            width="10"
            height="12"
            rx="2"
            stroke="#854F0B"
            strokeWidth="1.2"
          />
          <line
            x1="4.5"
            y1="4.5"
            x2="9.5"
            y2="4.5"
            stroke="#854F0B"
            strokeWidth="1"
          />
          <line
            x1="4.5"
            y1="7"
            x2="9.5"
            y2="7"
            stroke="#854F0B"
            strokeWidth="1"
          />
          <line
            x1="4.5"
            y1="9.5"
            x2="7.5"
            y2="9.5"
            stroke="#854F0B"
            strokeWidth="1"
          />
        </svg>
        Ghi chú — {sectionLabel}
      </div>

      <textarea
        value={noteText}
        onChange={(e) => {
          setNoteText(e.target.value);
          setCharCount(e.target.value.length);
        }}
        onBlur={handleBlur}
        placeholder="VD: Respondent có vẻ do dự khi trả lời. Cần follow-up thêm..."
        className="w-full border border-black/[.08] rounded-[7px] py-[9px] px-3 font-sans text-[13px] text-[var(--text)] bg-white/70 resize-y min-h-[72px] outline-none transition-colors focus:border-[#EF9F27] placeholder:text-[var(--amber)] placeholder:opacity-70"
      />
      <div
        className={`text-right text-[11px] mt-1 font-mono ${
          charCount > 720
            ? "text-[var(--coral)]"
            : charCount > 600
              ? "text-[var(--amber)]"
              : "text-[var(--muted)]"
        }`}
      >
        {charCount} / 800
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <span className="text-[11px] text-[var(--amber)]">Liên quan đến:</span>
        {questionKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleTag(key)}
            className={`text-[10px] py-[3px] px-[9px] rounded-full border font-mono transition-all select-none cursor-pointer ${
              taggedQuestions.includes(key)
                ? "bg-[var(--amber)] text-white border-[var(--amber)]"
                : "bg-white/60 text-[var(--amber)] border-black/10 hover:bg-white/90"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Sentiment */}
      <div className="flex gap-1.5 mt-2.5 flex-wrap items-center">
        <span className="text-[11px] text-[var(--amber)] mr-0.5">
          Cảm xúc:
        </span>
        {SENTIMENT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              toggleSentiment(opt.key);
              setTimeout(handleBlur, 0);
            }}
            className={`text-[11px] py-1 px-[11px] rounded-full border transition-all cursor-pointer ${
              sentiment === opt.key
                ? opt.activeClass
                : "border-[var(--gray-m)] bg-white/60 text-[var(--muted)] hover:bg-white/90"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
