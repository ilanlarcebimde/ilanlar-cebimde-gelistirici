"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Mic, MicOff, Lightbulb, X } from "lucide-react";
import { COUNTRIES } from "@/data/countries";
import { PROFESSION_AREAS } from "@/data/professions";
import { setAnswerBySaveKey, setAnswerBySaveKeyValue, getAnswerBySaveKey } from "@/data/cvQuestions";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { PhotoUpload } from "./PhotoUpload";
import { getChatFieldRulesBundle } from "@/lib/assistant/fieldRules";

interface ChatMessage {
  id: string;
  role: "system" | "user";
  text: string;
}

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
  nextAction: AssistantNextAction;
  save?: { key: string; value: unknown };
  progress?: { step: number; total: number };
};

type FieldRuleShape = {
  key: string;
  inputType: string;
  examples?: string[];
};

type AssistantState = {
  sessionId: string;
  locale: "tr-TR";
  cv: Record<string, unknown>;
  filledKeys: string[];
  history: Array<{ role: "user" | "assistant"; text: string }>;
  allowedKeys: string[];
  keyHints?: Record<string, string>;
  fieldRules: Record<string, FieldRuleShape>;
};

function getFilledKeys(answers: Record<string, unknown>, allowedKeys: string[]): string[] {
  return allowedKeys.filter((k) => {
    const v = getAnswerBySaveKey(answers, k);
    return typeof v === "string" && v.trim().length > 0;
  });
}

export function ChatWizard({
  answers,
  country,
  jobArea,
  jobBranch,
  photoUrl,
  photoFile,
  onAnswersChange,
  onCountryChange,
  onJobAreaChange,
  onJobBranchChange,
  onPhotoChange,
  onPhotoUploaded,
  onPhotoClear,
  onComplete,
  isCompleting = false,
  userId,
}: {
  answers: Record<string, unknown>;
  country: string;
  jobArea: string;
  jobBranch: string;
  photoUrl: string | null;
  photoFile: File | null;
  onAnswersChange: (a: Record<string, unknown>) => void;
  onCountryChange: (c: string) => void;
  onJobAreaChange: (a: string) => void;
  onJobBranchChange: (b: string) => void;
  onPhotoChange: (f: File) => void;
  onPhotoUploaded?: (file: File, url: string) => void;
  onPhotoClear: () => void;
  userId?: string;
  onComplete: () => void;
  isCompleting?: boolean;
}) {
  const { allowedKeys, keyHints, fieldRules } = useMemo(() => getChatFieldRulesBundle(), []);
  const sessionIdRef = useRef(`chat_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState<AssistantReply | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [geminiError, setGeminiError] = useState("");
  const [questionsDone, setQuestionsDone] = useState(false);
  const [phase, setPhase] = useState<"countryJob" | "photo">("countryJob");
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceAssistant();
  const wasListeningRef = useRef(false);

  const filledKeys = useMemo(() => getFilledKeys(answers, allowedKeys), [answers, allowedKeys]);

  const buildState = useCallback(
    (
      history: Array<{ role: "user" | "assistant"; text: string }>,
      cvOverride?: Record<string, unknown>
    ): AssistantState => {
      const cv = cvOverride ?? answers ?? {};
      return {
        sessionId: sessionIdRef.current,
        locale: "tr-TR",
        cv,
        filledKeys: getFilledKeys(cv, allowedKeys),
        history: history.slice(-40),
        allowedKeys,
        keyHints: keyHints ?? {},
        fieldRules: fieldRules ?? {},
      };
    },
    [answers, allowedKeys, keyHints, fieldRules]
  );

  const fetchNext = useCallback(
    async (state: AssistantState): Promise<AssistantReply | null> => {
      setBusy(true);
      setGeminiError("");
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
          setGeminiError(detail ? `${errMsg}: ${detail}` : errMsg);
          return null;
        }
        const data = (await r.json()) as { reply: AssistantReply };
        return data.reply;
      } catch (e: unknown) {
        setGeminiError(e instanceof Error ? e.message : "Bağlantı hatası.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    []
  );

  // İlk soruyu Gemini'den al (sadece mount'ta bir kez)
  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (allowedKeys.length === 0 || initialFetchDone.current) return;
    initialFetchDone.current = true;
    const state = buildState([]);
    fetchNext(state).then((next) => {
      if (!next) return;
      setReply(next);
      setMessages([{ id: "0", role: "system", text: next.displayText || next.speakText }]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sadece mount'ta bir kez
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, reply]);

  useEffect(() => {
    if (wasListeningRef.current && (voice.phase === "idle" || voice.phase === "converting")) {
      const text = (voice.getTranscript?.() ?? voice.transcript ?? "").trim();
      if (text) setInput(text);
      wasListeningRef.current = false;
    }
    if (voice.phase === "listening") wasListeningRef.current = true;
  }, [voice.phase, voice.transcript, voice.getTranscript]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !reply || busy) return;

      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: t };
      setMessages((m) => [...m, userMsg]);
      setInput("");

      const answerKey = reply.answerKey;
      let newAnswers = setAnswerBySaveKey(answers, answerKey, t);
      onAnswersChange(newAnswers);

      const prevDisplayText = reply.displayText || reply.speakText;
      const newHistory: Array<{ role: "user" | "assistant"; text: string }> = [
        ...messages.map((msg) => ({ role: msg.role as "user" | "assistant", text: msg.text })),
        { role: "assistant", text: prevDisplayText },
        { role: "user", text: t },
      ];

      setReply(null);
      const next = await fetchNext(buildState(newHistory, newAnswers));

      if (next) {
        if (next.save?.key && next.save?.value !== undefined) {
          const sk = next.save.key;
          const val = next.save.value;
          if (sk === "mobility.drivingLicense" && Array.isArray(val)) {
            newAnswers = setAnswerBySaveKeyValue(newAnswers, sk, val);
          } else {
            newAnswers = setAnswerBySaveKey(
              newAnswers,
              sk,
              typeof val === "string" ? val : String(val)
            );
          }
          onAnswersChange(newAnswers);
        }
        setReply(next);
        setMessages((m) => [...m, { id: `s-${Date.now()}`, role: "system", text: next.displayText || next.speakText }]);
        if (next.nextAction === "FINISH") setQuestionsDone(true);
      }
    },
    [reply, answers, messages, busy, buildState, fetchNext, onAnswersChange]
  );

  const handleSkip = useCallback(async () => {
    if (!reply || busy) return;
    const prevDisplayText = reply.displayText || reply.speakText;
    const newHistory: Array<{ role: "user" | "assistant"; text: string }> = [
      ...messages.map((msg) => ({ role: msg.role as "user" | "assistant", text: msg.text })),
      { role: "assistant", text: prevDisplayText },
      { role: "user", text: "[Atla]" },
    ];
    setMessages((m) => [...m, { id: `u-skip-${Date.now()}`, role: "user", text: "Bu adımı atladım" }]);
    setReply(null);
    const next = await fetchNext(buildState(newHistory));
    if (next) {
      setReply(next);
      setMessages((m) => [...m, { id: `s-${Date.now()}`, role: "system", text: next.displayText || next.speakText }]);
      if (next.nextAction === "FINISH") setQuestionsDone(true);
    }
  }, [reply, messages, busy, buildState, fetchNext]);

  const showCountryJob = questionsDone && phase === "countryJob";
  const showPhotoStep = questionsDone && phase === "photo";
  const currentReply = reply;
  const progress = currentReply?.progress;
  const hintExamples = currentReply?.hintExamples?.length
    ? currentReply.hintExamples
    : currentReply?.examples?.length
      ? currentReply.examples
      : [];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  useEffect(() => {
    handleTextareaInput();
  }, [input, voice.transcript]);

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden"
      >
        <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-slate-700">Sohbet ile CV bilgileri</p>
            <p className="text-xs text-slate-500">Gemini ile sohbet edin; yanıtlar otomatik kaydedilir.</p>
          </div>
          {progress && !questionsDone && (
            <span className="text-xs font-medium text-slate-500">
              Soru {progress.step} / {progress.total}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2.5 bg-slate-100 text-slate-500 text-sm">Yazıyor…</div>
            </div>
          )}
          {geminiError && (
            <div className="rounded-xl bg-red-50 text-red-700 px-4 py-2 text-sm">{geminiError}</div>
          )}

          {currentReply && !showCountryJob && !showPhotoStep && (
            <>
              {(hintExamples.length > 0 || (currentReply.examples?.length ?? 0) > 0) && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTipsOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm w-fit"
                  >
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    İpuçlarını Gör
                  </button>
                </div>
              )}
              {isTipsOpen && (hintExamples.length > 0 || (currentReply.examples?.length ?? 0) > 0) && (
                <>
                  <div
                    className="fixed inset-0 z-[100] bg-black/40 sm:flex sm:items-center sm:justify-center"
                    onClick={() => setIsTipsOpen(false)}
                    aria-hidden
                  />
                  <div
                    className="fixed z-[101] w-full left-0 right-0 bottom-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-[560px] sm:max-h-[70vh] sm:rounded-2xl sm:shadow-xl rounded-t-2xl bg-white max-h-[70vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                  >
                    <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3">
                      <h2 className="text-base font-semibold text-slate-800">İpuçları</h2>
                      <button
                        type="button"
                        onClick={() => setIsTipsOpen(false)}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                        aria-label="Kapat"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div
                      className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2"
                      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
                    >
                      {hintExamples.length > 0 && (
                        <p className="text-xs font-medium text-slate-500 mb-2">İpuçları</p>
                      )}
                      {hintExamples.map((c) => (
                        <div
                          key={c}
                          className="w-full text-left rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        >
                          {c}
                        </div>
                      ))}
                      {(currentReply.examples?.length ?? 0) > 0 && (
                        <p className="text-xs font-medium text-slate-500 mt-4 mb-2">Öneriler (kopyalayıp yapıştırabilirsiniz)</p>
                      )}
                      {(currentReply.examples ?? []).map((c) => (
                        <div
                          key={c}
                          className="w-full text-left rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {currentReply.showSkipButton && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={busy}
                  className="text-sm text-slate-500 underline hover:no-underline disabled:opacity-50"
                >
                  Bu adımı atla
                </button>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {!showCountryJob && !showPhotoStep && (
          <div
            className="sticky bottom-0 z-10 shrink-0 bg-white border-t border-slate-200 px-3 sm:px-6 py-3 min-w-0 overflow-hidden"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <div className="flex gap-2 min-w-0 items-end">
              <textarea
                ref={textareaRef}
                value={voice.phase === "listening" ? voice.transcript : input}
                onChange={(e) => voice.phase !== "listening" && setInput(e.target.value)}
                onInput={handleTextareaInput}
                placeholder={voice.phase === "listening" ? "Dinleniyor…" : "Yanıtınızı yazın..."}
                readOnly={voice.phase === "listening"}
                rows={1}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 resize-none overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-words min-h-[44px] max-h-[160px] leading-6"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={busy || voice.phase === "listening"}
                className="rounded-xl bg-slate-800 p-2.5 text-white hover:bg-slate-700 shrink-0 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
              {voice.isSTTSupported ? (
                <button
                  type="button"
                  onClick={() => {
                    if (voice.phase === "listening") voice.stopSTT();
                    else voice.startSTT();
                  }}
                  className={`rounded-xl p-2.5 shrink-0 ${
                    voice.phase === "listening"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                  aria-label={voice.phase === "listening" ? "Dinlemeyi durdur" : "Sesli yanıt"}
                >
                  <Mic className="h-5 w-5" />
                </button>
              ) : (
                <span
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-400 shrink-0"
                  title="Bu tarayıcı sesli girişi desteklemiyor"
                  aria-label="Sesli giriş desteklenmiyor"
                >
                  <MicOff className="h-5 w-5" />
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {showCountryJob && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Hedef ülke ve meslek</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ülke</label>
              <select
                value={country}
                onChange={(e) => onCountryChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              >
                <option value="">Seçin</option>
                {COUNTRIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meslek alanı</label>
              <select
                value={jobArea}
                onChange={(e) => {
                  onJobAreaChange(e.target.value);
                  onJobBranchChange("");
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              >
                <option value="">Seçin</option>
                {PROFESSION_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            {jobArea && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Meslek dalı</label>
                <select
                  value={jobBranch}
                  onChange={(e) => onJobBranchChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                >
                  <option value="">Seçin</option>
                  {(PROFESSION_AREAS.find((a) => a.id === jobArea)?.branches ?? []).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPhase("photo")}
            disabled={!country || !jobBranch}
            className="mt-6 rounded-xl bg-slate-800 px-6 py-3 text-white font-medium disabled:opacity-50"
          >
            Devam et — Fotoğraf
          </button>
        </motion.div>
      )}

      {showPhotoStep && (
        <>
          <p className="text-slate-600 text-center mb-4">
            Son olarak, CV'niz için profesyonel bir fotoğraf yüklemek ister misiniz?
          </p>
          <PhotoUpload
            photoUrl={photoUrl}
            photoFile={photoFile}
            onPhotoChange={onPhotoChange}
            onPhotoUploaded={onPhotoUploaded}
            onClear={onPhotoClear}
            userId={userId}
          />
          {!getAnswerBySaveKey(answers, "personal.email")?.trim() && (
            <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-posta adresiniz (ödeme ve bilgilendirme için gerekli)
              </label>
              <input
                type="email"
                placeholder="ornek@email.com"
                value={getAnswerBySaveKey(answers, "personal.email") || ""}
                onChange={(e) =>
                  onAnswersChange(setAnswerBySaveKey(answers, "personal.email", e.target.value.trim()))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPhase("countryJob")}
              className="rounded-xl border border-slate-300 px-6 py-3 text-slate-700 font-medium"
            >
              Geri
            </button>
            <button
              type="button"
              onClick={onComplete}
              disabled={isCompleting || !getAnswerBySaveKey(answers, "personal.email")?.trim()}
              className="rounded-xl bg-slate-800 px-6 py-3 text-white font-medium disabled:opacity-50"
            >
              {isCompleting ? "Kaydediliyor…" : "Tamamla"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
