"use client";

import { useState, useCallback } from "react";
import type { QuestionDef } from "@/lib/questions/types";
import type { Json } from "@/types/database";

interface QuestionCardProps {
  question: QuestionDef;
  value: Json | undefined;
  groupVariant?: string;
  sectionColor?: string;
  sectionBg?: string;
  onChange: (key: string, value: Json) => void;
}

export function QuestionCard({
  question,
  value,
  groupVariant = "lrn",
  sectionColor = "#0F6E56",
  sectionBg = "#E1F5EE",
  onChange,
}: QuestionCardProps) {
  const [otherText, setOtherText] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleRadioSelect = useCallback(
    (option: string) => {
      if (question.hasOther && option === "Khác (ghi rõ)") {
        onChange(question.key, { value: [option], other_text: otherText });
      } else {
        onChange(question.key, option);
      }
    },
    [question, onChange, otherText]
  );

  const handleCheckboxSelect = useCallback(
    (option: string) => {
      const currentArr = Array.isArray(value)
        ? (value as string[])
        : typeof value === "object" &&
            value !== null &&
            "value" in (value as Record<string, unknown>)
          ? ((value as Record<string, unknown>).value as string[])
          : [];

      let newArr: string[];
      if (currentArr.includes(option)) {
        newArr = currentArr.filter((v) => v !== option);
      } else {
        if (question.maxSelect && currentArr.length >= question.maxSelect) {
          return;
        }
        newArr = [...currentArr, option];
      }

      if (question.hasOther && newArr.includes("Khác (ghi rõ)")) {
        onChange(question.key, { value: newArr, other_text: otherText });
      } else {
        onChange(question.key, newArr);
      }
    },
    [question, value, onChange, otherText]
  );

  const handleOtherTextChange = useCallback(
    (text: string) => {
      setOtherText(text);
      if (question.type === "radio") {
        onChange(question.key, {
          value: ["Khác (ghi rõ)"],
          other_text: text,
        });
      } else {
        const currentArr = Array.isArray(value) ? (value as string[]) : [];
        onChange(question.key, { value: currentArr, other_text: text });
      }
    },
    [question, value, onChange]
  );

  const isRadioSelected = (option: string): boolean => {
    if (typeof value === "string") return value === option;
    if (
      typeof value === "object" &&
      value !== null &&
      "value" in (value as Record<string, unknown>)
    ) {
      const arr = (value as Record<string, unknown>).value as string[];
      return arr.includes(option);
    }
    return false;
  };

  const isCheckboxSelected = (option: string): boolean => {
    if (Array.isArray(value)) return (value as string[]).includes(option);
    if (
      typeof value === "object" &&
      value !== null &&
      "value" in (value as Record<string, unknown>)
    ) {
      const arr = (value as Record<string, unknown>).value as string[];
      return arr.includes(option);
    }
    return false;
  };

  const isOtherSelected =
    question.hasOther &&
    (isRadioSelected("Khác (ghi rõ)") || isCheckboxSelected("Khác (ghi rõ)"));

  const showConditional =
    question.conditional &&
    ((typeof value === "string" &&
      value === question.conditional.triggerValue) ||
      (typeof value === "object" &&
        value !== null &&
        "value" in (value as Record<string, unknown>) &&
        (
          (value as Record<string, unknown>).value as string[]
        ).includes(question.conditional.triggerValue)));

  const variantClass = groupVariant;

  const getSelectedClass = () => {
    switch (variantClass) {
      case "tch":
        return "!bg-[var(--teal-l)] !border-[var(--teal)] !text-[var(--teal)]";
      case "par":
        return "!bg-[var(--coral-l)] !border-[var(--coral)] !text-[var(--coral)]";
      case "cns":
        return "!bg-[var(--blue-l)] !border-[var(--blue)] !text-[var(--blue)]";
      case "clt":
        return "!bg-[var(--amber-l)] !border-[var(--amber)] !text-[var(--amber)]";
      default:
        return "!bg-[var(--purple-l)] !border-[var(--purple)] !text-[var(--purple)]";
    }
  };

  const getControlSelectedClass = () => {
    switch (variantClass) {
      case "tch":
        return "!bg-[var(--teal)] !border-[var(--teal)]";
      case "par":
        return "!bg-[var(--coral)] !border-[var(--coral)]";
      case "cns":
        return "!bg-[var(--blue)] !border-[var(--blue)]";
      case "clt":
        return "!bg-[var(--amber)] !border-[var(--amber)]";
      default:
        return "!bg-[var(--purple)] !border-[var(--purple)]";
    }
  };

  const selectedClass = getSelectedClass();
  const controlSelectedClass = getControlSelectedClass();

  const currentCheckboxCount = Array.isArray(value)
    ? (value as string[]).length
    : typeof value === "object" &&
        value !== null &&
        "value" in (value as Record<string, unknown>)
      ? ((value as Record<string, unknown>).value as string[]).length
      : 0;

  return (
    <div className="bg-white border border-[var(--gray-m)] rounded-[10px] p-5 mb-3 transition-all focus-within:border-[var(--purple)] focus-within:shadow-[0_0_0_3px_rgba(83,74,183,0.08)]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3.5">
        <span
          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md whitespace-nowrap mt-0.5 shrink-0"
          style={{ background: sectionBg, color: sectionColor }}
        >
          {question.key}
        </span>
        <div className="flex-1">
          <div className="text-sm font-medium text-[var(--text)] leading-[1.45]">
            {question.text}
          </div>
          {question.helper && (
            <div className="text-xs text-[var(--muted)] mt-1 italic">
              {question.helper}
            </div>
          )}
        </div>
        <span className="text-[10px] px-[7px] py-0.5 rounded-full bg-[var(--gray-l)] text-[var(--muted)] font-mono whitespace-nowrap shrink-0">
          {question.type}
        </span>
      </div>

      {/* Radio options */}
      {question.type === "radio" && question.options && (
        <div className="flex flex-col gap-[7px]">
          {question.options.map((option) => {
            const selected = isRadioSelected(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleRadioSelect(option)}
                className={`flex items-center gap-2.5 py-[9px] px-[13px] border rounded-lg cursor-pointer transition-all select-none text-left ${
                  selected
                    ? selectedClass
                    : "border-[var(--gray-m)] hover:bg-[var(--gray-l)] hover:border-[#ccc]"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all ${
                    selected
                      ? controlSelectedClass
                      : "border-[var(--gray-m)]"
                  }`}
                >
                  {selected && (
                    <svg width="8" height="8" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" fill="white" />
                    </svg>
                  )}
                </span>
                <span className="text-[13px] flex-1">{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Checkbox options */}
      {question.type === "checkbox" && question.options && (
        <>
          <div className="flex flex-col gap-[7px]">
            {question.options.map((option) => {
              const selected = isCheckboxSelected(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleCheckboxSelect(option)}
                  className={`flex items-center gap-2.5 py-[9px] px-[13px] border rounded-lg cursor-pointer transition-all select-none text-left ${
                    selected
                      ? selectedClass
                      : "border-[var(--gray-m)] hover:bg-[var(--gray-l)] hover:border-[#ccc]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all border-[1.5px] ${
                      selected
                        ? controlSelectedClass
                        : "border-[var(--gray-m)]"
                    }`}
                  >
                    {selected && (
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
                    )}
                  </span>
                  <span className="text-[13px] flex-1">{option}</span>
                </button>
              );
            })}
          </div>
          {question.maxSelect && (
            <div
              className={`text-[11px] mt-1.5 ${
                currentCheckboxCount >= question.maxSelect
                  ? "text-[var(--coral)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {currentCheckboxCount >= question.maxSelect &&
                `Chỉ được chọn tối đa ${question.maxSelect} lựa chọn.`}
            </div>
          )}
        </>
      )}

      {/* Other input */}
      {isOtherSelected && (
        <div className="mt-2 p-[10px_13px] bg-[var(--gray-l)] rounded-lg border border-dashed border-[var(--gray-m)]">
          <input
            type="text"
            value={otherText}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            placeholder="Ghi rõ..."
            className="w-full border-none bg-transparent font-sans text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
          />
        </div>
      )}

      {/* Textarea */}
      {question.type === "textarea" && (
        <>
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => {
              setCharCount(e.target.value.length);
              onChange(question.key, e.target.value);
            }}
            placeholder="Nhập câu trả lời chi tiết..."
            className="w-full border border-[var(--gray-m)] rounded-lg p-[10px_13px] font-sans text-[13px] text-[var(--text)] bg-white resize-y transition-colors outline-none focus:border-[var(--purple)] focus:shadow-[0_0_0_3px_rgba(83,74,183,0.08)] min-h-[90px]"
          />
          <div
            className={`text-right text-[11px] mt-1 font-mono ${
              charCount > 900
                ? "text-[var(--coral)]"
                : charCount > 700
                  ? "text-[var(--amber)]"
                  : "text-[var(--muted)]"
            }`}
          >
            {charCount} / 1000
          </div>
        </>
      )}

      {/* Text input (single-line) */}
      {question.type === "text" && (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(question.key, e.target.value)}
          placeholder="Nhập câu trả lời..."
          className="w-full border border-[var(--gray-m)] rounded-lg py-[9px] px-[13px] font-sans text-[13px] text-[var(--text)] bg-white transition-colors outline-none focus:border-[var(--purple)] focus:shadow-[0_0_0_3px_rgba(83,74,183,0.08)]"
        />
      )}

      {/* Scale */}
      {question.type === "scale" &&
        question.scaleMin !== undefined &&
        question.scaleMax !== undefined &&
        (() => {
          const sMin = question.scaleMin as number;
          const sMax = question.scaleMax as number;
          return (
          <div className="py-1">
            <div className="flex gap-1.5 mb-2">
              {Array.from(
                { length: sMax - sMin + 1 },
                (_, i) => i + sMin
              ).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange(question.key, n)}
                  className={`flex-1 h-9 border rounded-md flex items-center justify-center text-xs font-mono cursor-pointer transition-all ${
                    value === n
                      ? "bg-[var(--purple)] border-[var(--purple)] text-white font-medium"
                      : "border-[var(--gray-m)] text-[var(--muted)] hover:bg-[var(--gray-l)] hover:text-[var(--text)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-[var(--muted)]">
              <span>{question.scaleMinLabel}</span>
              <span>{question.scaleMaxLabel}</span>
            </div>
          </div>
          );
        })()}

      {/* Number */}
      {question.type === "number" && (
        <div className="flex items-center gap-2.5">
          <input
            type="number"
            value={typeof value === "number" ? value : ""}
            onChange={(e) =>
              onChange(
                question.key,
                e.target.value ? Number(e.target.value) : ""
              )
            }
            placeholder={question.numberPlaceholder || "Nhập số..."}
            className="border border-[var(--gray-m)] rounded-lg py-[9px] px-[13px] font-mono text-sm text-[var(--text)] w-[140px] outline-none transition-colors focus:border-[var(--purple)] focus:shadow-[0_0_0_3px_rgba(83,74,183,0.08)]"
          />
          {question.numberUnit && (
            <span className="text-xs text-[var(--muted)]">
              {question.numberUnit}
            </span>
          )}
        </div>
      )}

      {/* Conditional field */}
      {question.conditional && showConditional && (
        <div className="mt-2.5 p-3 bg-[var(--gray-l)] rounded-lg border-l-[3px] border-l-[var(--gray-m)]">
          <div className="text-xs text-[var(--muted)] mb-1.5">
            {question.conditional.label}
          </div>
          <input
            type="text"
            onChange={(e) =>
              onChange(`${question.key}_conditional`, e.target.value)
            }
            placeholder={question.conditional.placeholder}
            className="w-full border border-[var(--gray-m)] rounded-lg py-[9px] px-[13px] font-sans text-[13px] text-[var(--text)] bg-white outline-none transition-colors focus:border-[var(--purple)] focus:shadow-[0_0_0_3px_rgba(83,74,183,0.08)]"
          />
        </div>
      )}
    </div>
  );
}
