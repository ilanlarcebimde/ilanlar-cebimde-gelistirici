"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FLOW_STEPS } from "./flowSteps";

type Phase = "question" | "thinking" | "streaming" | "done" | "error";

const THINKING_LINES = [
  "İlan detayları derleniyor…",
  "Koşullar ve olası belgeler eşleştiriliyor…",
  "Kişisel rehber hazırlanıyor…",
];

type JobGuideFlowModalProps = {
  open: boolean;
  onClose: () => void;
  jobId: string;
  guideId: string;
  initialStepIndex: number;
  initialAnswers: Record<string, unknown>;
  onComplete?: () => void;
};

export function JobGuideFlowModal({
  open,
  onClose,
  jobId,
  guideId,
  initialStepIndex,
  initialAnswers,
  onComplete,
}: JobGuideFlowModalProps) {
  const [phase, setPhase] = useState<Phase>("question");
  const [stepIndex, setStepIndex] = useState(initialStepIndex);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [buffer, setBuffer] = useState("");
  const [visible, setVisible] = useState("");
  const [thinkingLine, setThinkingLine] = useState(THINKING_LINES[0]);

  const typeIdxRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const step = FLOW_STEPS[stepIndex];
  const question = step?.question ?? "Tamamlandı.";
  const stepId = step?.id ?? "";
  const isFinished = stepIndex >= FLOW_STEPS.length;

  // Sync from parent when open/initial change
  useEffect(() => {
    if (!open) return;
    setStepIndex(initialStepIndex);
    setAnswers(initialAnswers);
    setPhase("question");
    setBuffer("");
    setVisible("");
    typeIdxRef.current = 0;
  }, [open, initialStepIndex, initialAnswers]);

  // Thinking rotasyon
  useEffect(() => {
    if (phase !== "thinking") return;
    let i = 0;
    const t = window.setInterval(() => {
      i = (i + 1) % THINKING_LINES.length;
      setThinkingLine(THINKING_LINES[i]);
    }, 850);
    return () => window.clearInterval(t);
  }, [phase]);

  // Typewriter
  useEffect(() => {
    if (phase !== "streaming" && phase !== "done") return;

    const tick = () => {
      const target = buffer;
      const idx = typeIdxRef.current;

      if (idx < target.length) {
        const step = Math.min(7, target.length - idx);
        typeIdxRef.current = idx + step;
        setVisible(target.slice(0, idx + step));
        timerRef.current = window.setTimeout(() => requestAnimationFrame(tick), 28);
        return;
      }

      if (phase === "streaming") {
        timerRef.current = window.setTimeout(() => requestAnimationFrame(tick), 60);
      }
    };

    tick();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [buffer, phase]);

  const saveAnswers = useCallback(
    async (nextAnswers: Record<string, unknown>, nextStepIndex: number) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      await fetch("/api/job-guide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jobGuideId: guideId,
          answers_json: nextAnswers,
          progress_step: nextStepIndex + 1,
        }),
      });
    },
    [guideId]
  );

  const goNextStep = useCallback(
    (currentAnswers: Record<string, unknown>) => {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      setAnswers(currentAnswers);
      setPhase("question");
      setBuffer("");
      setVisible("");
      typeIdxRef.current = 0;
      void saveAnswers(currentAnswers, nextIndex);

      if (nextIndex >= FLOW_STEPS.length) {
        onComplete?.();
      }
    },
    [stepIndex, saveAnswers, onComplete]
  );

  const onAnswer = useCallback(
    async (choice: "Evet" | "Hayır") => {
      if (!step) return;
      const nextAnswers = { ...answers, [step.answerKey]: choice };
      setAnswers(nextAnswers);

      if (choice === "Evet") {
        goNextStep(nextAnswers);
        return;
      }

      setBuffer("");
      setVisible("");
      typeIdxRef.current = 0;
      setPhase("thinking");
      const minThinkingMs = 700;
      const start = Date.now();

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("auth");

        const res = await fetch("/api/job-guides/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ jobId, stepId: step.id, answers: nextAnswers }),
        });

        if (!res.ok || !res.body) throw new Error("stream_failed");

        const elapsed = Date.now() - start;
        if (elapsed < minThinkingMs) {
          await new Promise((r) => setTimeout(r, minThinkingMs - elapsed));
        }

        setPhase("streaming");

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) setBuffer((prev) => prev + decoder.decode(value, { stream: true }));
        }

        setPhase("done");

        setTimeout(() => goNextStep(nextAnswers), 600);
      } catch {
        setPhase("error");
      }
    },
    [step, answers, jobId, goNextStep]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="İlan rehberi"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm text-slate-500">İlan Rehberi</div>
          <div className="text-lg font-semibold text-slate-900">{question}</div>
        </div>

        <div className="space-y-4 p-5">
          {phase === "question" && !isFinished && step && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onAnswer("Evet")}
                className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                Evet
              </button>
              <button
                type="button"
                onClick={() => onAnswer("Hayır")}
                className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hayır
              </button>
            </div>
          )}

          {phase === "question" && isFinished && (
            <div className="space-y-3">
              <p className="text-slate-600">Tüm adımlar tamamlandı.</p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-brand-600 py-3 text-sm font-medium text-white hover:bg-brand-700"
              >
                Kapat
              </button>
            </div>
          )}

          {phase === "thinking" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="animate-pulse text-slate-700">{thinkingLine}</div>
            </div>
          )}

          {(phase === "streaming" || phase === "done") && (
            <div className="whitespace-pre-wrap rounded-xl border border-slate-200 p-4 leading-7 text-slate-700">
              {visible}
              {phase === "streaming" && (
                <span className="inline-block w-2 animate-pulse" aria-hidden>
                  ▍
                </span>
              )}
            </div>
          )}

          {phase === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              Şu an yanıt üretilemedi. Tekrar deneyin.
              <button
                type="button"
                onClick={() => setPhase("question")}
                className="ml-2 underline"
              >
                Soruya dön
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
