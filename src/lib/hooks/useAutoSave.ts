"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveState {
  status: SaveStatus;
  lastSavedAt: Date | null;
}

export function useAutoSave(sessionId: string) {
  const [state, setState] = useState<AutoSaveState>({
    status: "idle",
    lastSavedAt: null,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Map<string, Json>>(new Map());
  const supabase = createClient();

  const flush = useCallback(async () => {
    const entries = Array.from(pendingRef.current.entries());
    if (entries.length === 0) return;

    setState((s) => ({ ...s, status: "saving" }));
    pendingRef.current.clear();

    try {
      const upserts = entries.map(([questionKey, answerValue]) => ({
        session_id: sessionId,
        question_key: questionKey,
        answer_value: answerValue,
      }));

      const { error } = await supabase.from("responses").upsert(upserts, {
        onConflict: "session_id,question_key",
      });

      if (error) throw error;

      setState({ status: "saved", lastSavedAt: new Date() });
    } catch {
      setState((s) => ({ ...s, status: "error" }));
    }
  }, [sessionId, supabase]);

  const saveResponse = useCallback(
    (questionKey: string, value: Json) => {
      pendingRef.current.set(questionKey, value);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        flush();
      }, 3000);
    },
    [flush]
  );

  const saveImmediately = useCallback(
    async (questionKey: string, value: Json) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      pendingRef.current.set(questionKey, value);
      await flush();
    },
    [flush]
  );

  const saveNote = useCallback(
    async (
      sectionKey: string,
      noteText: string,
      taggedQuestions: string[],
      sentimentHint: string | null
    ) => {
      setState((s) => ({ ...s, status: "saving" }));

      try {
        const { error } = await supabase.from("session_notes").upsert(
          {
            session_id: sessionId,
            section_key: sectionKey,
            note_text: noteText,
            tagged_questions: taggedQuestions,
            sentiment_hint: sentimentHint,
          },
          { onConflict: "session_id,section_key" }
        );

        if (error) throw error;

        setState({ status: "saved", lastSavedAt: new Date() });
      } catch {
        setState((s) => ({ ...s, status: "error" }));
      }
    },
    [sessionId, supabase]
  );

  const retry = useCallback(() => {
    flush();
  }, [flush]);

  const flushAll = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    await flush();
  }, [flush]);

  return {
    ...state,
    saveResponse,
    saveImmediately,
    saveNote,
    flushAll,
    retry,
  };
}
