"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic, MicOff, Lightbulb, X } from "lucide-react";
import { COUNTRIES } from "@/data/countries";
import { PROFESSION_AREAS } from "@/data/professions";
import {
  getQuestionsFor,
  setAnswerBySaveKey,
  getDisplayName,
} from "@/data/cvQuestions";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { PhotoUpload } from "./PhotoUpload";

interface ChatMessage {
  id: string;
  role: "system" | "user";
  text: string;
}

const QUESTIONS = getQuestionsFor("chat");

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
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const first = QUESTIONS[0];
    return first
      ? [
          { id: "0", role: "system", text: "Merhaba. CV'nizi oluşturmak için soruları tek tek soracağım. İlk olarak adınızı ve soyadınızı alalım." },
          { id: "0q", role: "system", text: first.question },
        ]
      : [];
  });
  const [input, setInput] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceAssistant();
  const wasListeningRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sesli giriş bittiğinde transkripti input'a yaz (düzenleyip gönderebilsin)
  useEffect(() => {
    if (wasListeningRef.current && (voice.phase === "idle" || voice.phase === "converting")) {
      const text = (voice.getTranscript?.() ?? voice.transcript ?? "").trim();
      if (text) setInput(text);
      wasListeningRef.current = false;
    }
    if (voice.phase === "listening") wasListeningRef.current = true;
  }, [voice.phase, voice.transcript, voice.getTranscript]);

  const currentQ = QUESTIONS[qIndex];
  const nextQ = QUESTIONS[qIndex + 1];

  const send = (text: string) => {
    const t = text.trim();
    if (!t || !currentQ) return;
    const userMsg: ChatMessage = { id: `${Date.now()}`, role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    const newAnswers = setAnswerBySaveKey(answers, currentQ.saveKey, t);
    onAnswersChange(newAnswers);

    if (nextQ) {
      const displayName = getDisplayName(newAnswers);
      const nextQuestionText = displayName ? `${displayName}, ${nextQ.question}` : nextQ.question;
      setTimeout(() => {
        setMessages((m) => [...m, { id: `s-${currentQ.id}`, role: "system", text: nextQuestionText }]);
        setQIndex((i) => i + 1);
      }, 400);
    } else {
      setQIndex((i) => i + 1);
    }
  };

  const questionsDone = qIndex >= QUESTIONS.length;
  const [phase, setPhase] = useState<"countryJob" | "photo">("countryJob");
  const showCountryJob = questionsDone && phase === "countryJob";
  const showPhotoStep = questionsDone && phase === "photo";
  const [isTipsOpen, setIsTipsOpen] = useState(false);
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
        {/* Header: sticky */}
        <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-slate-700">Sohbet ile CV bilgileri</p>
            <p className="text-xs text-slate-500">Her yanıt otomatik kaydedilir.</p>
          </div>
          {currentQ && !questionsDone && (
            <span className="text-xs font-medium text-slate-500">
              Soru {qIndex + 1} / {QUESTIONS.length}
            </span>
          )}
        </div>

        {/* Body: scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {currentQ && !showCountryJob && (
            <div className="flex flex-col gap-2">
              {currentQ.hint && (
                <p className="text-xs text-slate-500">{currentQ.hint}</p>
              )}
              {currentQ.examples?.length > 0 && (
                <>
                  <p className="text-xs text-slate-500">İstersen ipuçlarını açabilirsin.</p>
                  <button
                    type="button"
                    onClick={() => setIsTipsOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm w-fit"
                  >
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    İpuçlarını Gör
                  </button>
                </>
              )}
            </div>
          )}

          {/* İpuçları bottom-sheet (mobil) / dialog (masaüstü) */}
          {isTipsOpen && currentQ?.examples?.length > 0 && (
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
                aria-labelledby="tips-title"
                aria-modal="true"
              >
                <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3">
                  <h2 id="tips-title" className="text-base font-semibold text-slate-800">İpuçları</h2>
                  <button
                    type="button"
                    onClick={() => setIsTipsOpen(false)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                    aria-label="Kapat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="shrink-0 px-4 sm:px-6 pt-2 text-xs text-slate-500">
                  Bu soruyu doğru doldurmak için kısa öneriler
                </p>
                <div
                  className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2"
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
                >
                  {currentQ.examples.map((c) => (
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
          {currentQ?.type === "select" && Array.isArray(currentQ.options) && currentQ.options.length > 0 && !showCountryJob && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              <span className="w-full text-xs font-medium text-slate-500">Seçenekler</span>
              {currentQ.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => send(opt)}
                  className="w-full sm:w-auto text-left rounded-full border border-slate-300 bg-white px-4 py-3 sm:px-3 sm:py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer: sticky + safe-area (içerik taşmasın, mikrofon ekran içinde kalsın) */}
        {!showCountryJob && (
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
                disabled={voice.phase === "listening"}
                className="rounded-xl bg-slate-800 p-2.5 text-white hover:bg-slate-700 shrink-0 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
              {voice.isSTTSupported ? (
                <button
                  type="button"
                  onClick={() => {
                    if (voice.phase === "listening") {
                      voice.stopSTT();
                    } else {
                      voice.startSTT();
                    }
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
                  {PROFESSION_AREAS.find((a) => a.id === jobArea)?.branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  )) ?? []}
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
            Son olarak, CV’niz için profesyonel bir fotoğraf yüklemek ister misiniz?
          </p>
          <PhotoUpload
            photoUrl={photoUrl}
            photoFile={photoFile}
            onPhotoChange={onPhotoChange}
            onPhotoUploaded={onPhotoUploaded}
            onClear={onPhotoClear}
            userId={userId}
          />
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
              className="rounded-xl bg-slate-800 px-6 py-3 text-white font-medium"
            >
              Tamamla
            </button>
          </div>
        </>
      )}
    </div>
  );
}
