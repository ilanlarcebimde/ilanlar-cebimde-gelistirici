"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic } from "lucide-react";
import { COUNTRIES } from "@/data/countries";
import { PROFESSION_AREAS } from "@/data/professions";
import {
  getQuestionsFor,
  setAnswerBySaveKey,
  TOTAL_QUESTION_STEPS,
} from "@/data/cvQuestions";
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
      ? [{ id: "0", role: "system", text: "Merhaba. Profesyonel CV'n için soruları tek tek soracağım. Hazırsan başlayalım." }, { id: "0q", role: "system", text: first.question }]
      : [];
  });
  const [input, setInput] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentQ = QUESTIONS[qIndex];
  const nextQ = QUESTIONS[qIndex + 1];

  const send = (text: string) => {
    const t = text.trim();
    if (!t || !currentQ) return;
    const userMsg: ChatMessage = { id: `${Date.now()}`, role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const newAnswers = setAnswerBySaveKey(answers, currentQ.saveKey, t);
    onAnswersChange(newAnswers);

    if (nextQ) {
      setTimeout(() => {
        setMessages((m) => [...m, { id: `s-${currentQ.id}`, role: "system", text: nextQ.question }]);
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

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden"
      >
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-700">Sohbet ile CV bilgileri</p>
            <p className="text-xs text-slate-500">Her yanıt otomatik kaydedilir.</p>
          </div>
          {currentQ && !questionsDone && (
            <span className="text-xs font-medium text-slate-500">
              Soru {qIndex + 1} / {TOTAL_QUESTION_STEPS}
            </span>
          )}
        </div>
        <div className="max-h-[360px] overflow-y-auto p-4 space-y-4">
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
          {currentQ?.hint && !showCountryJob && (
            <div className="flex items-start gap-2 text-amber-700 bg-amber-50 rounded-lg px-3 py-2 text-xs">
              <span aria-hidden>💡</span>
              <span>{currentQ.hint}</span>
            </div>
          )}
          {currentQ?.examples?.length > 0 && !showCountryJob && (
            <div className="flex flex-wrap gap-2">
              {currentQ.examples.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => send(c)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {!showCountryJob && (
          <div className="flex gap-2 p-4 border-t border-slate-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Yanıtınızı yazın..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => send(input)}
              className="rounded-xl bg-slate-800 p-2.5 text-white hover:bg-slate-700"
            >
              <Send className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-300 p-2.5 text-slate-600 hover:bg-slate-50"
              aria-label="Sesli giriş"
            >
              <Mic className="h-5 w-5" />
            </button>
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
