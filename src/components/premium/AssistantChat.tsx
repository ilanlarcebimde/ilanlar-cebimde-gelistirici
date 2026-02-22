"use client";

import { useState, useRef, useEffect } from "react";

const INITIAL_QUESTIONS = [
  "Pasaportun var mı? (Var / Yok / Başvurdum)",
  "Hangi meslekte çalışıyorsun?",
  "Kaç yıl deneyimin var?",
  "Dil seviyen? (Hiç / A1 / A2 / B1 / B2)",
  "Bu ülkeye gidebilir misin? (Aile, sağlık, ehliyet vb.)",
  "CV hazır mı? (Var / Yok)",
];

export type ChatMessage = { role: "user" | "assistant" | "system"; text: string };

export function AssistantChat({
  messages,
  nextQuestions,
  onSendAnswer,
  onUpdateReport,
  updating,
}: {
  messages: ChatMessage[];
  nextQuestions: string[];
  onSendAnswer: (text: string) => void;
  onUpdateReport: () => void;
  updating?: boolean;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    onSendAnswer(t);
    setInput("");
  };

  const displayQuestions = nextQuestions.length > 0 ? nextQuestions : (messages.length === 0 ? INITIAL_QUESTIONS.slice(0, 2) : []);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm h-[600px] overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-2">
        <h2 className="text-base font-bold text-slate-900">Soru-Cevap Asistanı</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : m.role === "system"
                    ? "bg-slate-100 text-slate-700"
                    : "bg-slate-50 text-slate-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {updating && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-500">
              Rapor güncelleniyor…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {displayQuestions.length > 0 && !updating && (
        <div className="border-t border-slate-100 px-4 py-2 flex flex-wrap gap-2">
          {displayQuestions.slice(0, 5).map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendAnswer(q)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {q.length > 30 ? q.slice(0, 28) + "…" : q}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cevabınızı yazın..."
          className="min-h-[44px] flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 min-h-[44px]"
        >
          Gönder
        </button>
      </form>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={onUpdateReport}
          disabled={updating}
          className="w-full rounded-xl border-2 border-brand-600 bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50 min-h-[44px]"
        >
          🔄 Raporu Güncelle
        </button>
      </div>
    </div>
  );
}
