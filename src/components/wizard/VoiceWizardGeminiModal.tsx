"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NormalizeConfirm } from "@/components/wizard/NormalizeConfirm";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { setAnswerBySaveKey } from "@/data/cvQuestions";

type AssistantNextAction = "ASK" | "CLARIFY" | "SAVE_AND_NEXT" | "FINISH";

type AssistantReply = {
  speakText: string;
  displayText: string;
  answerKey: string;
  inputType: "text" | "textarea" | "number" | "date" | "select";
  examples: string[];
  validation?: { required?: boolean; minLength?: number; maxLength?: number; pattern?: string };
  review?: {
    needsNormalization?: boolean;
    normalizedHint?: string;
    normalizedValue?: string;
    confidence?: number;
  };
  nextAction: AssistantNextAction;
  save?: { key: string; value: unknown };
  progress?: { step: number; total: number };
  debug?: { reason?: string };
};

type FieldRuleShape = {
  key: string;
  label?: string;
  inputType: "text" | "textarea" | "number" | "date" | "select";
  examples?: string[];
  validation?: { required?: boolean; minLength?: number; maxLength?: number; pattern?: string };
  semantic?: { kind?: string; normalizeHint?: string };
};

type AssistantState = {
  sessionId: string;
  locale: "tr-TR";
  cv: Record<string, unknown>;
  filledKeys: string[];
  lastQuestion?: string;
  lastAnswer?: string;
  history: Array<{ role: "user" | "assistant"; text: string }>;
  target?: { role?: string; country?: string };
  allowedKeys: string[];
  keyHints?: Record<string, string>;
  fieldRules: Record<string, FieldRuleShape>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  cv: Record<string, unknown>;
  filledKeys: string[];
  setAnswers: (answers: Record<string, unknown>) => void;
  target?: { role?: string; country?: string };
  allowedKeys: string[];
  keyHints?: Record<string, string>;
  fieldRules: Record<string, FieldRuleShape>;
  /** Parent create/load akışında kullanılır; yoksa modal kendi sessionId üretir. */
  sessionId?: string | null;
};

function newSessionId() {
  return `va_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function VoiceWizardGeminiModal({
  isOpen,
  onClose,
  onFinish,
  cv,
  filledKeys,
  setAnswers,
  target,
  allowedKeys,
  keyHints,
  fieldRules,
  sessionId: sessionIdProp,
}: Props) {
  const voice = useVoiceAssistant();

  const [assistantState, setAssistantState] = useState<AssistantState>(() => ({
    sessionId: sessionIdProp ?? newSessionId(),
    locale: "tr-TR",
    cv: cv ?? {},
    filledKeys: filledKeys ?? [],
    history: [],
    target,
    allowedKeys,
    keyHints: keyHints ?? {},
    fieldRules: fieldRules ?? {},
  }));

  const [reply, setReply] = useState<AssistantReply | null>(null);
  const [localText, setLocalText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showFinishedMessage, setShowFinishedMessage] = useState(false);
  const lastSpokenRef = useRef("");

  useEffect(() => {
    setAssistantState((s) => ({
      ...s,
      cv: cv ?? {},
      filledKeys: filledKeys ?? [],
      target,
      allowedKeys,
      keyHints: keyHints ?? {},
      fieldRules: fieldRules ?? {},
      ...(sessionIdProp != null ? { sessionId: sessionIdProp } : {}),
    }));
  }, [cv, filledKeys, target, allowedKeys, keyHints, fieldRules, sessionIdProp]);

  async function fetchNext(state: AssistantState) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/assistant/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error((j as { error?: string })?.error ?? "assistant_failed");
      }

      const data = (await r.json()) as { reply: AssistantReply };
      const next = data.reply;

      setReply(next);
      setLocalText("");
      return next;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "assistant_failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const stateToSend: AssistantState = {
      ...assistantState,
      cv: cv ?? {},
      filledKeys: filledKeys ?? [],
      target,
    };

    const init = async () => {
      const next = await fetchNext(stateToSend);
      if (next?.speakText) {
        lastSpokenRef.current = next.speakText;
        await voice.playTTS(next.speakText);
      }
    };

    init();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !reply?.speakText) return;
    if (lastSpokenRef.current === reply.speakText) return;

    const run = async () => {
      lastSpokenRef.current = reply.speakText;
      await voice.playTTS(reply.speakText);
    };

    run();
  }, [reply?.speakText, isOpen]);

  const canListen = voice.isSTTSupported;

  async function handleStopAndSubmit() {
    setError("");
    voice.stopSTT();

    const spoken = (voice.getTranscript() ?? "").trim();
    const typed = (localText ?? "").trim();
    const finalText = (typed.length > 0 ? typed : spoken).trim();

    if (!finalText) {
      setError("Cevap boş görünüyor. Kısaca yazabilir veya tekrar konuşabilirsin.");
      return;
    }

    setLocalText(finalText);

    const currentReply = reply;
    const currentQuestion = currentReply?.displayText ?? currentReply?.speakText ?? "";

    const nextState: AssistantState = {
      ...assistantState,
      lastQuestion: currentQuestion,
      lastAnswer: finalText,
      history: [
        ...assistantState.history,
        ...(currentQuestion ? [{ role: "assistant" as const, text: currentQuestion }] : []),
        { role: "user" as const, text: finalText },
      ].slice(-40),
    };

    setAssistantState(nextState);

    const next = await fetchNext(nextState);
    if (!next) return;

    if (next.nextAction === "FINISH") {
      await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: assistantState.sessionId }),
      }).catch(() => {});

      setShowFinishedMessage(true);
      onFinish();
      return;
    }

    if (next.nextAction === "SAVE_AND_NEXT" && next.save?.key) {
      const needsNorm = !!next.review?.needsNormalization && !!next.review?.normalizedValue;
      if (!needsNorm) {
        const newAnswers = setAnswerBySaveKey(cv, next.save!.key, String(next.save!.value ?? ""));
        const newFilledKeys = filledKeys.includes(next.save!.key)
          ? filledKeys
          : [...filledKeys, next.save!.key];
        setAnswers(newAnswers);
        await saveSession(newAnswers, newFilledKeys, [
          { key: next.save!.key, value: next.save!.value },
        ]);
      }
    }
  }

  async function saveSession(
    cvState: Record<string, unknown>,
    filledKeysList: string[],
    updates: Array<{ key: string; value: unknown }>
  ) {
    try {
      const r = await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: assistantState.sessionId,
          cv: cvState,
          updates,
          allowedKeys,
          fieldRules,
          filledKeys: filledKeysList,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        setError((j as { error?: string })?.error ?? "Kayıt güncellenemedi.");
      }
    } catch {
      setError("Kayıt güncellenemedi.");
    }
  }

  function handleClickExample(ex: string) {
    setLocalText((prev) => {
      const p = (prev ?? "").trim();
      if (!p) return ex;
      if (p.includes(ex)) return p;
      return `${p} ${ex}`.trim();
    });
  }

  async function handleConfirmNormalize(finalText: string) {
    if (!reply?.save?.key) return;
    const newAnswers = setAnswerBySaveKey(cv, reply.save.key, finalText);
    const newFilledKeys = filledKeys.includes(reply.save.key)
      ? filledKeys
      : [...filledKeys, reply.save.key];
    setAnswers(newAnswers);
    setLocalText("");
    await saveSession(newAnswers, newFilledKeys, [
      { key: reply.save!.key, value: finalText },
    ]);
  }

  if (!isOpen) return null;

  const overlayClass = "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3";
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (showFinishedMessage) {
    return (
      <div className={overlayClass} onClick={handleBackdropClick}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center"
        >
          <p className="text-lg font-medium text-slate-800">Bilgileriniz kaydedildi.</p>
          <p className="mt-2 text-sm text-slate-500">Teşekkürler.</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
            onClick={onClose}
          >
            Tamam
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={overlayClass} onClick={handleBackdropClick}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl border border-slate-200/80"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold text-slate-900">Sesli Asistan</div>
            <div className="text-xs text-slate-500">
              Soru Gemini tarafından üretilir, ElevenLabs seslendirir.
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Kapat
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <div className="text-sm font-semibold text-slate-800">Soru</div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {reply?.displayText ?? (busy ? "Hazırlanıyor…" : "Başlatılıyor…")}
          </div>

          {reply?.progress ? (
            <div className="mt-2 text-xs text-slate-500">
              {reply.progress.step} / {reply.progress.total}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-40 hover:bg-slate-700"
              onClick={() => reply?.speakText && voice.playTTS(reply.speakText)}
              disabled={!reply?.speakText || busy}
            >
              Soruyu Tekrar Oku
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              onClick={() => voice.startSTT()}
              disabled={!canListen || busy}
            >
              Konuş
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              onClick={handleStopAndSubmit}
              disabled={busy}
            >
              Sonlandır ve Gönder
            </button>
          </div>

          {!canListen ? (
            <div className="mt-2 text-xs text-amber-600">
              Bu tarayıcı konuşma tanımayı desteklemiyor.
            </div>
          ) : null}

          {reply?.examples?.length ? (
            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-600">Öneriler</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {reply.examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    onClick={() => handleClickExample(ex)}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-800">Cevabın</div>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800"
            rows={4}
            value={localText || voice.transcript}
            onChange={(e) => setLocalText(e.target.value)}
            placeholder="Konuşarak veya yazarak cevap ver…"
          />

          <NormalizeConfirm
            originalText={localText}
            normalizedText={reply?.review?.normalizedValue != null ? String(reply.review.normalizedValue) : undefined}
            hint={reply?.review?.normalizedHint}
            onConfirm={handleConfirmNormalize}
          />

          {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <div>Durum: {voice.phase}</div>
            {reply?.debug?.reason ? <div>Not: {reply.debug.reason}</div> : <div />}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
