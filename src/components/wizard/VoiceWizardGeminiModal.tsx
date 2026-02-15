"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Mic, MicOff } from "lucide-react";
import { NormalizeConfirm } from "@/components/wizard/NormalizeConfirm";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { setAnswerBySaveKey, inferHitapFromFullName } from "@/data/cvQuestions";
import { cleanTextForTTS } from "@/lib/ttsClean";
import { normalizeDateTranscript } from "@/lib/dateTranscriptNormalize";

type AssistantNextAction = "ASK" | "CLARIFY" | "SAVE_AND_NEXT" | "FINISH";

type AssistantReply = {
  speakText: string;
  displayText: string;
  answerKey: string;
  inputType: "text" | "textarea" | "number" | "date" | "select";
  examples: string[];
  showSuggestions?: boolean;
  showSkipButton?: boolean;
  hintExamples?: string[];
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
  /** Giriş yapmış kullanıcı id (oturumlar panele bağlansın). */
  userId?: string;
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
  userId,
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
  const [hintOpen, setHintOpen] = useState(false);
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

  useEffect(() => {
    if (reply) {
      setHintOpen(false);
      setLocalText("");
      voice.setTranscript("");
    }
  }, [reply?.answerKey]);

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
        const j = (await r.json().catch(() => null)) as { error?: string; detail?: string } | null;
        const errMsg = j?.error ?? "assistant_failed";
        const detail = j?.detail?.trim();
        setError(detail ? `${errMsg}: ${detail}` : errMsg);
        return null;
      }

      const data = (await r.json()) as { reply: AssistantReply };
      const next = data.reply;

      setReply(next);
      setLocalText("");
      return next;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bağlantı hatası.");
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
        const toSpeak = cleanTextForTTS(next.speakText, { answerKey: next.answerKey });
        lastSpokenRef.current = next.speakText;
        await voice.playTTS(toSpeak);
      }
    };

    init();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !reply?.speakText) return;
    if (lastSpokenRef.current === reply.speakText) return;

    const run = async () => {
      lastSpokenRef.current = reply.speakText;
      const toSpeak = cleanTextForTTS(reply.speakText, { answerKey: reply.answerKey });
      await voice.playTTS(toSpeak);
    };

    run();
  }, [reply?.speakText, isOpen]);

  const canListen = voice.isSTTSupported;
  const isEmailStep = reply?.answerKey === "personal.email";
  const isHitapStep = reply?.answerKey === "personal.hitap";
  const showSuggestionsChips = reply?.showSuggestions === true && (reply?.examples?.length ?? 0) > 0;
  const showSkipButton = reply?.showSkipButton === true;
  const hitapOptions = isHitapStep ? (reply?.examples?.length ? reply.examples : ["Bey", "Hanım", "Sadece isim"]) : [];
  /** İpucu kartında gösterilecek örnekler: API hintExamples veya açık uçlu sorularda examples. */
  const hintExamples = reply?.hintExamples?.length
    ? reply.hintExamples
    : reply?.showSuggestions !== true && reply?.examples?.length
      ? reply.examples
      : [];

  async function handleSkip() {
    if (!reply) return;
    setError("");
    voice.stopSTT();
    const currentQuestion = reply.displayText ?? reply.speakText ?? "";
    const skipState: AssistantState = {
      ...assistantState,
      lastQuestion: currentQuestion,
      lastAnswer: "[Kullanıcı bu adımı atladı]",
      history: [
        ...assistantState.history,
        ...(currentQuestion ? [{ role: "assistant" as const, text: currentQuestion }] : []),
        { role: "user" as const, text: "[Atla]" },
      ].slice(-40),
    };
    setAssistantState(skipState);
    setLocalText("");
    setReply(null);
    const next = await fetchNext(skipState);
    if (next?.speakText) {
      lastSpokenRef.current = next.speakText;
      await voice.playTTS(cleanTextForTTS(next.speakText, { answerKey: next.answerKey }));
    }
  }

  async function handleStopAndSubmit(overrideText?: string) {
    setError("");
    voice.stopSTT();

    const spoken = (voice.getTranscript() ?? "").trim();
    const typed = (localText ?? "").trim();
    let finalText = (overrideText ?? (typed.length > 0 ? typed : spoken)).trim();
    if (reply?.answerKey === "personal.birthDate" && finalText) {
      finalText = normalizeDateTranscript(finalText);
    }

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
        body: JSON.stringify({ sessionId: assistantState.sessionId, userId: userId ?? undefined }),
      }).catch(() => {});

      setShowFinishedMessage(true);
      onFinish();
      return;
    }

    if (next.nextAction === "SAVE_AND_NEXT" && next.save?.key) {
      const needsNorm = !!next.review?.needsNormalization && !!next.review?.normalizedValue;
      if (!needsNorm) {
        const saveKey = next.save!.key;
        const saveValue = String(next.save!.value ?? "");
        let newAnswers = setAnswerBySaveKey(cv, saveKey, saveValue);
        const newFilledKeys = filledKeys.includes(saveKey) ? filledKeys : [...filledKeys, saveKey];
        const updates: Array<{ key: string; value: unknown }> = [{ key: saveKey, value: next.save!.value }];
        if (saveKey === "personal.fullName") {
          const hitap = inferHitapFromFullName(saveValue);
          newAnswers = setAnswerBySaveKey(newAnswers, "personal.hitap", hitap);
        }
        setAnswers(newAnswers);
        await saveSession(newAnswers, newFilledKeys, updates);
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
          userId: userId ?? undefined,
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
              Soruları sesli dinleyebilir, konuşarak veya yazarak yanıtlayabilirsiniz.
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
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                Soru
                {voice.phase === "playing" && (
                  <span className="flex gap-0.5" aria-hidden>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 rounded-full bg-slate-400"
                        animate={{ height: [4, 12, 4] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        style={{ height: 4 }}
                      />
                    ))}
                  </span>
                )}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {reply?.displayText ?? (busy ? "Hazırlanıyor…" : "Başlatılıyor…")}
              </div>
            </div>
            {hintExamples.length > 0 ? (
              <button
                type="button"
                onClick={() => setHintOpen((o) => !o)}
                className="shrink-0 flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                title="İpucu"
              >
                <Lightbulb className="h-3.5 w-3.5" /> İpucu
              </button>
            ) : null}
          </div>
          {hintOpen && hintExamples.length > 0 ? (
            <div className="mt-3 rounded-lg bg-amber-50/80 border border-amber-200 p-3">
              <div className="text-xs font-semibold text-amber-900 mb-2">Örnek cevaplar</div>
              <ul className="space-y-1 text-xs text-amber-800">
                {hintExamples.slice(0, 4).map((ex) => (
                  <li key={ex}>• {ex}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {reply?.progress ? (
            <div className="mt-2 text-xs text-slate-500">
              {reply.progress.step} / {reply.progress.total}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <button
              type="button"
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-40 hover:bg-slate-700"
              onClick={() =>
                reply?.speakText &&
                voice.playTTS(cleanTextForTTS(reply.speakText, { answerKey: reply.answerKey }))
              }
              disabled={!reply?.speakText || busy}
            >
              Soruyu Tekrar Oku
            </button>
            {!isEmailStep && !isHitapStep && (
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-40 hover:bg-slate-50 inline-flex items-center gap-1.5"
                onClick={() => voice.startSTT()}
                disabled={!canListen || busy}
              >
                {voice.phase === "listening" ? (
                  <>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1 rounded-full bg-red-500"
                          animate={{ height: [6, 14, 6] }}
                          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                          style={{ height: 6 }}
                        />
                      ))}
                    </span>
                    Dinleniyor…
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Konuş
                  </>
                )}
              </button>
            )}
            {isEmailStep && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <MicOff className="h-3.5 w-3.5" /> Bu alanı yazarak doldurun.
              </span>
            )}
            {!isHitapStep && (
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                onClick={() => handleStopAndSubmit()}
                disabled={busy}
              >
                Yanıt verdim
              </button>
            )}
            {showSkipButton && (
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                onClick={handleSkip}
                disabled={busy}
              >
                Bu Adımı Atla
              </button>
            )}
          </div>

          {voice.lastError ? (
            <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {voice.lastError}
            </div>
          ) : null}

          {!isEmailStep && !canListen ? (
            <div className="mt-2 text-xs text-amber-600">
              Bu tarayıcı konuşma tanımayı desteklemiyor.
            </div>
          ) : null}

          {showSuggestionsChips && !isHitapStep && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-600">Öneriler</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(reply?.examples ?? []).map((ex) => (
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
          )}

          {isHitapStep && hitapOptions.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-600">Seçin</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {hitapOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => handleStopAndSubmit(opt)}
                    disabled={busy}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isHitapStep ? (
          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-800">Cevabın</div>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800"
              rows={4}
              value={
                localText ||
                (reply?.answerKey === "personal.birthDate"
                  ? normalizeDateTranscript(voice.transcript)
                  : voice.transcript)
              }
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
        ) : null}
      </motion.div>
    </div>
  );
}
