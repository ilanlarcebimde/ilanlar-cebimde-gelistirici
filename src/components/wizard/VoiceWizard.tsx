"use client";

import { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { COUNTRIES } from "@/data/countries";
import { PROFESSION_AREAS } from "@/data/professions";
import { getVoiceFieldRulesBundle } from "@/lib/assistant/fieldRules";
import { createSession, loadSession } from "@/lib/assistant/sessionClient";
import { unflattenCv } from "@/lib/assistant/applyFieldRules";
import { PhotoUpload } from "./PhotoUpload";
import { VoiceWizardGeminiModal } from "./VoiceWizardGeminiModal";

function newSessionId() {
  return `va_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** Nested answers objesinden dolu alanların noktalı yollarını döndürür (örn. personal.fullName). */
function getFilledKeysFromAnswers(obj: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v)) {
      out.push(...getFilledKeysFromAnswers(v as Record<string, unknown>, path));
    } else if (v != null && String(v).trim() !== "") {
      out.push(path);
    }
  }
  return out;
}

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
  onComplete: () => void;
  isCompleting?: boolean;
  userId?: string;
}) {
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [questionsComplete, setQuestionsComplete] = useState(false);
  const [phase2, setPhase2] = useState<"countryJob" | "photo">("countryJob");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCompletedGate, setShowCompletedGate] = useState(false);
  const lastCreatedSessionIdRef = useRef<string | null>(null);

  const filledKeys = useMemo(() => getFilledKeysFromAnswers(answers), [answers]);

  const { allowedKeys, keyHints, fieldRules } = useMemo(() => getVoiceFieldRulesBundle(), []);

  if (allowedKeys.length === 0) {
    console.error("allowedKeys boş geldi: cvQuestions'ta saveKey bulunamadı.");
  }

  const target = useMemo(
    () => ({ role: jobBranch || jobArea || undefined, country: country || undefined }),
    [jobArea, jobBranch, country]
  );

  function openWizard() {
    if (!sessionId) {
      const id = newSessionId();
      lastCreatedSessionIdRef.current = id;
      setSessionId(id);
      setShowCompletedGate(false);
      setGeminiModalOpen(true);
      createSession({ sessionId: id, target, userId }).then((created) => {
        if (created?.ok) {
          onAnswersChange(unflattenCv(created.session.cv));
        }
      });
      return;
    }

    loadSession(sessionId, userId).then((loaded) => {
      if (!loaded?.ok) {
        const id = newSessionId();
        lastCreatedSessionIdRef.current = id;
        setSessionId(id);
        setShowCompletedGate(false);
        setGeminiModalOpen(true);
        createSession({ sessionId: id, target, userId }).then((c) => {
          if (c?.ok) onAnswersChange(unflattenCv(c.session.cv));
        });
        return;
      }
      if (loaded.session.completed) {
        setShowCompletedGate(true);
        return;
      }
      onAnswersChange(unflattenCv(loaded.session.cv));
      setShowCompletedGate(false);
      setGeminiModalOpen(true);
    });
  }

  function startNewSession() {
    const id = newSessionId();
    lastCreatedSessionIdRef.current = id;
    setSessionId(id);
    onAnswersChange({});
    setShowCompletedGate(false);
    setGeminiModalOpen(true);
    createSession({ sessionId: id, target, userId }).then((c) => {
      if (c?.ok) onAnswersChange(unflattenCv(c.session.cv));
    });
  }

  return (
    <div className="space-y-8">
      {!geminiModalOpen && !questionsComplete && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft"
          >
            <div className="flex flex-col items-center text-center max-w-xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Mic className="h-6 w-6" />
                </span>
                <span className="text-lg font-semibold text-slate-800">Sesli Asistan</span>
              </div>
              <p className="text-slate-600 mb-2">
                Asistanınız size etkili ve işe alınma ihtimalinizi artıracak sorular soracak. İsterseniz sesli yanıtlayabilir, isterseniz yazarak cevaplayabilirsiniz.
              </p>
              <p className="text-slate-500 text-sm mb-6">
                Merak etmeyin; gelişmiş sistemimiz hataları giderecek ve sizin için en etkili CV’yi oluşturacaktır.
              </p>
              <button
                type="button"
                onClick={openWizard}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-8 py-4 text-lg font-medium text-white shadow-soft hover:bg-slate-700 transition-colors"
              >
                <Mic className="h-6 w-6" /> Sesli Asistanı Başlat
              </button>
            </div>
          </motion.div>

          {showCompletedGate ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-slate-800">Bu oturum daha önce tamamlanmış.</p>
              <p className="mt-1 text-xs text-slate-500">
                Devam etmek yerine yeni bir oturum başlatabilirsin.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={startNewSession}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700"
                >
                  Yeni Oturum Başlat
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompletedGate(false)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <VoiceWizardGeminiModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        onFinish={() => {
          setGeminiModalOpen(false);
          setQuestionsComplete(true);
        }}
        cv={answers}
        filledKeys={filledKeys}
        setAnswers={onAnswersChange}
        target={target}
        allowedKeys={allowedKeys}
        keyHints={keyHints}
        fieldRules={fieldRules}
        sessionId={sessionId ?? lastCreatedSessionIdRef.current}
        userId={userId}
      />

      {!geminiModalOpen && questionsComplete && phase2 === "countryJob" && (
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
                  {(PROFESSION_AREAS.find((a) => a.id === jobArea)?.branches ?? []).map((b) => (
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
            className="mt-6 rounded-xl bg-slate-800 px-6 py-3 text-white font-medium disabled:opacity-50 hover:bg-slate-700"
          >
            Devam et — Fotoğraf
          </button>
        </div>
      )}

      {!geminiModalOpen && questionsComplete && phase2 === "photo" && (
        <>
          <p className="text-slate-600">
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPhase2("countryJob")}
              className="rounded-xl border border-slate-300 px-6 py-3 text-slate-700 font-medium hover:bg-slate-50"
            >
              Geri
            </button>
            <button
              type="button"
              onClick={onComplete}
              disabled={isCompleting}
              className="rounded-xl bg-slate-800 px-6 py-3 text-white font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {isCompleting ? "Kaydediliyor…" : "Tamamla"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
