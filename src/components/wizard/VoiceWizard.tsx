"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send } from "lucide-react";
import { COUNTRIES } from "@/data/countries";
import { PROFESSION_AREAS } from "@/data/professions";
import {
  getQuestionsFor,
  setAnswerBySaveKey,
  getAnswerBySaveKey,
  TOTAL_QUESTION_STEPS,
} from "@/data/cvQuestions";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { PhotoUpload } from "./PhotoUpload";

const QUESTIONS = getQuestionsFor("voice");

export function VoiceWizard({
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
  onPhotoClear,
  onComplete,
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
  onPhotoClear: () => void;
  onComplete: () => void;
}) {
  const voice = useVoiceAssistant();
  const [listening, setListening] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [phase, setPhase] = useState<"idle" | "listening" | "converting" | "editing">("idle");
  const [phase2, setPhase2] = useState<"countryJob" | "photo">("countryJob");
  const [questionsComplete, setQuestionsComplete] = useState(false);

  const question = QUESTIONS[currentQ];
  const savedValue = question ? getAnswerBySaveKey(answers, question.saveKey) : "";
  const liveTranscript = listening ? voice.transcript : transcript;
  const displayValue = liveTranscript || savedValue;

  useEffect(() => {
    if (modalOpen && question) voice.playTTS(question.question);
  }, [modalOpen, currentQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    setModalOpen(true);
    setCurrentQ(0);
    setTranscript("");
    voice.setTranscript("");
  };

  const toggleMic = () => {
    if (listening) {
      setListening(false);
      voice.stopSTT();
      setPhase("converting");
      const finalText = voice.getTranscript() || transcript;
      setTranscript(finalText);
      setTimeout(() => {
        setPhase("editing");
        if (question) {
          const v = finalText.trim() || "(boş)";
          onAnswersChange(setAnswerBySaveKey(answers, question.saveKey, v));
        }
        setTimeout(() => setPhase("idle"), 800);
      }, 1200);
    } else {
      setListening(true);
      setPhase("listening");
      setTranscript("");
      voice.setTranscript("");
      voice.startSTT(() => {});
    }
  };

  const handleTranscriptChange = (v: string) => {
    setTranscript(v);
    if (!listening) voice.setTranscript(v);
  };

  const handleNext = () => {
    if (question && transcript.trim()) {
      onAnswersChange(setAnswerBySaveKey(answers, question.saveKey, transcript.trim()));
    } else if (question && savedValue) {
      // zaten kayıtlı
    }
    setTranscript("");
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((c) => c + 1);
    } else {
      setModalOpen(false);
      setQuestionsComplete(true);
    }
  };

  const handleChip = (text: string) => {
    setTranscript((t) => (t ? `${t} ${text}` : text));
  };

  return (
    <div className="space-y-8">
      {!modalOpen && !questionsComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft text-center"
        >
          <p className="text-slate-600 mb-6">
            Merhaba. Profesyonel CV’n için soruları tek tek soracağım. Konuşarak veya yazarak cevaplayabilirsin.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-8 py-4 text-lg font-medium text-white shadow-soft hover:bg-slate-700"
          >
            <Mic className="h-6 w-6" /> Sesli Asistanı Başlat
          </button>
        </motion.div>
      )}

      {!modalOpen && questionsComplete && phase2 === "countryJob" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
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
              onClick={() => setPhase2("photo")}
              disabled={!country || !jobBranch}
              className="mt-6 rounded-xl bg-slate-800 px-6 py-3 text-white font-medium disabled:opacity-50"
            >
              Devam et — Fotoğraf
            </button>
          </div>
      )}

      {!modalOpen && questionsComplete && phase2 === "photo" && (
            <>
              <p className="text-slate-600">
                Son olarak, CV’niz için profesyonel bir fotoğraf yüklemek ister misiniz?
              </p>
              <PhotoUpload
                photoUrl={photoUrl}
                photoFile={photoFile}
                onPhotoChange={onPhotoChange}
                onClear={onPhotoClear}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhase2("countryJob")}
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

      <AnimatePresence>
        {modalOpen && question && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex justify-between items-center">
                <span className="text-sm text-slate-500">
                  Sesli Asistan — Soru {currentQ + 1} / {TOTAL_QUESTION_STEPS}
                </span>
                <div className="h-2 flex-1 max-w-[200px] ml-4 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    className="h-full bg-slate-700 rounded-full"
                    initial={false}
                    animate={{ width: `${((currentQ + 1) / TOTAL_QUESTION_STEPS) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">Soru sesli okunuyor…</p>
              <p className="text-lg font-medium text-slate-900 mb-4">{question.question}</p>
              <p className="text-sm text-slate-500 mb-2">
                Konuşun veya aşağıya yazın. Söyledikleriniz metne dönüştürülecek.
              </p>
              {question.examples.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.examples.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChip(c)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={displayValue}
                onChange={(e) => handleTranscriptChange(e.target.value)}
                placeholder="Yazıyla cevapla..."
                className="w-full rounded-lg border border-slate-300 p-3 text-slate-800 min-h-[80px] mb-2"
                rows={3}
              />
              <p className="text-xs text-slate-400 mb-4">Yanıtı düzenleyebilir, sonra &quot;Yanıt verdim, devam et&quot; diyebilirsin.</p>
              {phase === "listening" && <p className="text-sm text-amber-600 mb-2">Dinleniyor…</p>}
              {phase === "converting" && <p className="text-sm text-slate-600 mb-2">Metne dönüştürülüyor…</p>}
              {phase === "editing" && <p className="text-sm text-slate-600 mb-2">Düzenleniyor…</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`rounded-xl px-4 py-2 flex items-center gap-2 font-medium ${
                    listening ? "bg-red-500 text-white" : "bg-slate-800 text-white"
                  }`}
                >
                  {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {listening ? "Sonlandır" : "Konuş"}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  Yanıt verdim, devam et <Send className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}