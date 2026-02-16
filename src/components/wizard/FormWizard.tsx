"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES } from "@/data/countries";
import { PROFESSION_AREAS } from "@/data/professions";
import {
  getQuestionsFor,
  setAnswerBySaveKey,
  getAnswerBySaveKey,
  setAnswerBySaveKeyValue,
  getAnswerBySaveKeyValue,
  dedupeOptions,
  FORM_PROFESSION_LIST,
} from "@/data/cvQuestions";
import { getTasksForProfessionTitle } from "@/data/professionLibrary";
import { PhotoUpload } from "./PhotoUpload";
import { Lightbulb } from "lucide-react";

const DURATION_OPTIONS = ["0–6 ay", "6–12 ay", "1–3 yıl", "3–5 yıl", "5+ yıl"];
const EDUCATION_LEVELS = ["İlkokul", "Ortaokul", "Lise", "Meslek lisesi", "Ön lisans", "Lisans", "Diğer"];
const LANGUAGE_LEVELS = ["Başlangıç", "Orta", "İyi", "Çok iyi"];
const COMMON_LANGUAGES = ["Almanca", "İngilizce", "Fransızca", "Arapça", "Rusça", "Hollandaca", "Diğer"];
const DRIVING_OPTIONS = ["Yok", "A1", "A2", "A", "B1", "B", "BE", "C1", "C1E", "C", "CE", "D1", "D1E", "D", "DE", "F", "M", "G", "Diğer"];
const PASSPORT_TYPES = ["Umuma", "Hususi", "Hizmet", "Diplomatik"];
const CERT_EXAMPLES = ["MYK Mesleki Yeterlilik", "Ustalık belgesi", "Hijyen belgesi", "İSG eğitimi", "Forklift belgesi"];
const CURRENCIES = ["TRY", "EUR", "USD", "GBP"];

const QUESTIONS = getQuestionsFor("form");

/** Formda e-posta formatı kontrolü */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(s: string): boolean {
  return EMAIL_REGEX.test(s.trim());
}

type Phase = "questions" | "countryJob" | "photo";

/** Mobil (max-width 640px) mi? */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return isMobile;
}

/** Mobilde viewport küçüldü mü (klavye açık)? */
function useViewportSmall(): boolean {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    if (!mq.matches) {
      setSmall(false);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return;
    const threshold = 0.6 * window.innerHeight;
    const update = () => setSmall(vv.height < threshold);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return small;
}

export function FormWizard({
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
  const isMobile = useIsMobile();
  const viewportSmall = useViewportSmall();
  const [phase, setPhase] = useState<Phase>("questions");
  const [step, setStep] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [professionSearch, setProfessionSearch] = useState("");
  const [suggestedTasksForIndex, setSuggestedTasksForIndex] = useState<number | null>(null);
  const [certExamplesOpen, setCertExamplesOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [jobAreaSearch, setJobAreaSearch] = useState("");
  const [educationAddMore, setEducationAddMore] = useState<string>("");

  const currentQ = QUESTIONS[step];
  const value = currentQ ? getAnswerBySaveKey(answers, currentQ.saveKey) : "";
  const isJobTitle = currentQ?.id === "job_title";
  const isWorkSummary = currentQ?.id === "work_summary";
  const isEducation = currentQ?.id === "education";
  const isLanguages = currentQ?.id === "languages";
  const isDrivingLicense = currentQ?.id === "driving_license";
  const isPassport = currentQ?.id === "passport";
  const isCertificates = currentQ?.id === "certificates";
  const isSalaryNote = currentQ?.id === "salary_note";
  const isFinalNote = currentQ?.id === "final_note";

  const jobTitleOther = currentQ && isJobTitle ? getAnswerBySaveKey(answers, "work.titleOther") : "";
  const setJobTitleOther = (v: string) => {
    if (!currentQ) return;
    onAnswersChange(setAnswerBySaveKey(answers, "work.titleOther", v));
  };

  type ExperienceItem = { company: string; position: string; duration: string; tasks: string };
  const experiences = (getAnswerBySaveKeyValue(answers, "work.experiences") as ExperienceItem[] | undefined) ?? [];
  const setExperiences = (arr: ExperienceItem[]) => {
    onAnswersChange(setAnswerBySaveKeyValue(answers, "work.experiences", arr));
  };

  // Dil listesi ayrı anahtarda (languagesList) tutulur; "languages" (Evet/Hayır) string kalır, setAnswerBySaveKeyValue("languages.list") ile üzerine yazılmaz.
  const languagesList = (getAnswerBySaveKeyValue(answers, "languagesList") as { lang: string; level: string }[] | undefined) ?? [];
  const setLanguagesList = (arr: { lang: string; level: string }[]) => {
    onAnswersChange(setAnswerBySaveKeyValue(answers, "languagesList", arr));
  };

  const drivingLicenseRaw = getAnswerBySaveKeyValue(answers, "mobility.drivingLicense");
  const drivingLicenses: string[] = Array.isArray(drivingLicenseRaw)
    ? drivingLicenseRaw
    : typeof drivingLicenseRaw === "string" && drivingLicenseRaw
    ? [drivingLicenseRaw]
    : [];
  const setDrivingLicenses = (arr: string[]) => {
    onAnswersChange(setAnswerBySaveKeyValue(answers, "mobility.drivingLicense", arr));
  };
  const drivingLicenseOther = getAnswerBySaveKey(answers, "mobility.drivingLicenseOther");

  type EducationItem = { level: string; schoolName?: string; department?: string; graduationYear?: string };
  const educationList = (getAnswerBySaveKeyValue(answers, "education.list") as EducationItem[] | undefined) ?? [];
  const setEducationList = (arr: EducationItem[]) => {
    onAnswersChange(setAnswerBySaveKeyValue(answers, "education.list", arr));
  };
  const currentEducationLevel = getAnswerBySaveKey(answers, "education.primary");
  const currentEducationSchool = getAnswerBySaveKey(answers, "education.schoolName");
  const currentEducationDept = getAnswerBySaveKey(answers, "education.department");
  const currentEducationYear = getAnswerBySaveKey(answers, "education.graduationYear");

  type CertItem = { name: string; year?: string; org?: string };
  const certificatesList = (getAnswerBySaveKeyValue(answers, "certificates.list") as CertItem[] | undefined) ?? [];
  const setCertificatesList = (arr: CertItem[]) => {
    onAnswersChange(setAnswerBySaveKeyValue(answers, "certificates.list", arr));
  };
  
  const passportValue = getAnswerBySaveKey(answers, "mobility.passport");
  const passportType = getAnswerBySaveKey(answers, "mobility.passportType");
  const passportExpiry = getAnswerBySaveKey(answers, "mobility.passportExpiry");
  const visaNote = getAnswerBySaveKey(answers, "mobility.visaNote");

  const salaryAmount = getAnswerBySaveKey(answers, "work.salaryAmount");
  const salaryMin = getAnswerBySaveKey(answers, "work.salaryMin");
  const salaryMax = getAnswerBySaveKey(answers, "work.salaryMax");
  const salaryCurrency = getAnswerBySaveKey(answers, "work.salaryCurrency") || "EUR";

  const setValue = (v: string) => {
    if (!currentQ) return;
    onAnswersChange(setAnswerBySaveKey(answers, currentQ.saveKey, v));
  };

  const goNext = () => {
    setSuggestionsOpen(false);
    // Eğitim adımında: İlk eğitim hem education.primary hem education.list[0]'a kaydedilmeli
    if (isEducation && value && educationList.length === 0 && educationAddMore !== "Evet") {
      const firstItem: EducationItem = {
        level: value,
        schoolName: currentEducationSchool || undefined,
        department: currentEducationDept || undefined,
        graduationYear: currentEducationYear || undefined,
      };
      setEducationList([firstItem]);
    }
    if (phase === "questions") {
      if (step < QUESTIONS.length - 1) setStep((s) => s + 1);
      else setPhase("countryJob");
    } else if (phase === "countryJob") {
      setPhase("photo");
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    setSuggestionsOpen(false);
    if (phase === "photo") setPhase("countryJob");
    else if (phase === "countryJob") setPhase("questions"), setStep(QUESTIONS.length - 1);
    else if (step > 0) setStep((s) => s - 1);
  };

  const suggestionChips = currentQ?.examples?.slice(0, 4) ?? [];
  const selectOptions = currentQ?.type === "select" && currentQ?.options ? dedupeOptions([...currentQ.options]) : [];
  const professionFiltered = FORM_PROFESSION_LIST.filter(
    (p) => p.toLowerCase().includes(professionSearch.trim().toLowerCase())
  );

  // Sadece kritik alanlar required: Ad Soyad, E-posta/Telefon, Ülke, Meslek alanı
  const isCriticalRequired = currentQ?.saveKey === "personal.fullName" || 
                              currentQ?.saveKey === "personal.email" || 
                              currentQ?.saveKey === "personal.phone" ||
                              currentQ?.saveKey === "work.title";
  const isFormRequired = currentQ ? (isCriticalRequired ? (currentQ.formRequired ?? currentQ.required) : false) : false;
  const isEmailStep = currentQ?.saveKey === "personal.email";

  const canNext = () => {
    if (phase === "questions" && currentQ) {
      if (isFormRequired && !value.trim()) return false;
      if (isEmailStep && isFormRequired && value.trim()) return isValidEmail(value);
      if (isFormRequired) return value.trim().length > 0;
    }
    if (phase === "countryJob") return country && jobArea;
    return true;
  };

  const questionCardRef = useRef<HTMLDivElement>(null);
  const focusMode = isMobile && (inputFocused || viewportSmall);

  const handleQuestionCardFocus = (e: React.FocusEvent) => {
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
      setInputFocused(true);
      questionCardRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  const handleQuestionCardBlur = useCallback((e: React.FocusEvent) => {
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
      setTimeout(() => setInputFocused(false), 120);
    }
  }, []);

  const nextLabel =
    isCompleting
      ? "Kaydediliyor…"
      : phase === "questions" && step < QUESTIONS.length - 1
      ? null
      : phase === "questions"
      ? "Devam et"
      : phase === "countryJob"
      ? "Devam et — Fotoğraf"
      : "Tamamla";

  const footerButtons = (
    <>
      <p className="text-[10px] text-slate-400 text-center mb-1.5">
        Bilgileriniz güvenle işlenir. Eksik alanlar sorun olmaz.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={goNext}
          disabled={phase === "questions" && isFormRequired ? (isEmailStep ? !value?.trim() || !isValidEmail(value) : !value?.trim()) : phase === "countryJob" ? !country || !jobArea : false || isCompleting}
          className="order-1 w-full sm:w-auto rounded-lg bg-slate-800 px-5 py-3 sm:py-2.5 text-sm font-medium text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-400/60 focus:ring-offset-1 touch-manipulation hover:bg-slate-700 transition-colors"
        >
          {nextLabel == null ? (
            <>
              <span className="sm:hidden">Devam Et</span>
              <span className="hidden sm:inline">İleri</span>
            </>
          ) : (
            nextLabel
          )}
        </button>
        <button
          type="button"
          onClick={goBack}
          disabled={phase === "questions" && step === 0}
          className="order-2 w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-5 py-3 sm:py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 touch-manipulation transition-colors"
        >
          <span className="sm:hidden">Önceki Soru</span>
          <span className="hidden sm:inline">Geri</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Focus Mode (mobil, klavye açık): mini soru çubuğu — başlık + Soru X/25 */}
      {phase === "questions" && focusMode && currentQ && (
        <div className="shrink-0 px-3 py-2 border-b border-slate-100 bg-white sm:hidden">
          <p className="text-xs font-medium text-slate-500 mb-0.5">Soru {step + 1} / {QUESTIONS.length}</p>
          <p className="text-sm font-medium text-slate-800 leading-tight line-clamp-2" title={currentQ.question}>
            {currentQ.question}
          </p>
        </div>
      )}

      {/* Normal header: Soru X/25 + progress (Focus Mode değilken veya desktop) */}
      {phase === "questions" && !focusMode && (
        <div className="shrink-0 px-4 pt-2 pb-2 sm:pb-2 border-b border-slate-100/80 bg-white">
          <span className="text-xs font-medium text-slate-500 block mb-1">Soru {step + 1} / {QUESTIONS.length}</span>
          <div className="h-0.5 w-full max-w-[160px] sm:max-w-[140px] rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              className="h-full bg-slate-600 rounded-full"
              initial={false}
              animate={{ width: `${QUESTIONS.length > 0 ? ((step + 1) / QUESTIONS.length) * 100 : 0}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-2.5 sm:pt-2 pb-4 flex flex-col" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
        <div className="space-y-3 max-w-xl mx-auto w-full sm:min-h-full sm:flex sm:flex-col sm:justify-center">
      <AnimatePresence mode="wait">
        {phase === "questions" && currentQ && (
          <motion.div
            ref={questionCardRef}
            onFocusCapture={handleQuestionCardFocus}
            onBlurCapture={handleQuestionCardBlur}
            key={currentQ.id}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className={`rounded-lg border border-slate-200/90 bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] ${focusMode ? "p-3 sm:p-4" : "p-4 sm:p-4"}`}
          >
            {!focusMode && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 mb-1 leading-snug tracking-tight">{currentQ.question}</h2>
                {(currentQ.formHint ?? currentQ.hint) && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-400 sm:text-slate-400/90 mb-2.5">
                    <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500/90" aria-hidden />
                    <span>{currentQ.formHint ?? currentQ.hint}</span>
                  </p>
                )}
                {(currentQ.examples?.length ?? 0) > 0 && (
                  <div className="mb-2.5">
                    <button
                      type="button"
                      onClick={() => setSuggestionsOpen((o) => !o)}
                      className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100/80 hover:border-slate-200 transition-colors"
                    >
                      Öneriler {suggestionsOpen ? "▼" : "▶"}
                    </button>
                  </div>
                )}
                {suggestionsOpen && (currentQ.examples?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2.5 p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                    {(currentQ.examples ?? []).slice(0, 4).map((ex) => {
                      const isClickable = !currentQ.examplesClickable || currentQ.examplesClickable !== false;
                      return (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => {
                            if (!isClickable) return;
                            if (currentQ.type === "select") {
                              setValue(ex);
                            } else if (currentQ.type === "multiline") {
                              setValue(value ? value + "\n" + ex : ex);
                            } else {
                              setValue(ex);
                            }
                          }}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                        >
                          {ex}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            {focusMode && (currentQ.formHint ?? currentQ.hint) && (
              <p className="text-xs text-slate-400 mb-2 line-clamp-1">
                {currentQ.formHint ?? currentQ.hint}
              </p>
            )}
            {currentQ.type === "multiline" ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={currentQ.examples[0] || "Yanıtınızı yazın..."}
                className={`w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 text-slate-800 placeholder:text-slate-400 resize-y ${focusMode ? "min-h-[100px]" : "min-h-[140px]"}`}
                rows={focusMode ? 3 : 6}
              />
            ) : isJobTitle ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={professionSearch}
                  onChange={(e) => setProfessionSearch(e.target.value)}
                  placeholder="Meslek ara..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 text-slate-800 placeholder:text-slate-400 min-h-[44px]"
                />
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 text-slate-800 min-h-[44px]"
                  aria-label="Meslek seçin"
                >
                  <option value="">Seçin</option>
                  {professionFiltered.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {value === "Diğer" && (
                  <input
                    type="text"
                    value={jobTitleOther}
                    onChange={(e) => setJobTitleOther(e.target.value)}
                    placeholder="Mesleğinizi kısa yazın"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 text-slate-800 placeholder:text-slate-400 min-h-[44px]"
                  />
                )}
              </div>
            ) : isWorkSummary ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">İstersen daha sonra da ekleyebilirsin.</p>
                {experiences.map((exp, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">İş yeri adı</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const next = [...experiences];
                            next[idx] = { ...next[idx], company: e.target.value };
                            setExperiences(next);
                          }}
                          placeholder="Şirket yoksa Serbest"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Pozisyon / Görev</label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => {
                            const next = [...experiences];
                            next[idx] = { ...next[idx], position: e.target.value };
                            setExperiences(next);
                          }}
                          placeholder="Örn. Elektrik ustası"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Süre</label>
                      <select
                        value={exp.duration}
                        onChange={(e) => {
                          const next = [...experiences];
                          next[idx] = { ...next[idx], duration: e.target.value };
                          setExperiences(next);
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                      >
                        <option value="">Seçin</option>
                        {DURATION_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="block text-xs font-medium text-slate-600">Görev maddeleri (2–4 madde)</label>
                        <button
                          type="button"
                          onClick={() => setSuggestedTasksForIndex(suggestedTasksForIndex === idx ? null : idx)}
                          className="text-xs text-slate-600 underline hover:no-underline"
                        >
                          Önerilen görevler
                        </button>
                      </div>
                      {suggestedTasksForIndex === idx && (
                        <div className="mb-2 p-2 rounded-lg bg-slate-100 border border-slate-200 max-h-48 overflow-y-auto">
                          {getTasksForProfessionTitle(getAnswerBySaveKey(answers, "work.title")).tasks.map((t, i) => (
                            <label key={i} className="flex items-start gap-2 py-1 text-sm">
                              <input
                                type="checkbox"
                                checked={exp.tasks.includes(t)}
                                onChange={(e) => {
                                  const next = [...experiences];
                                  const current = next[idx].tasks.split("\n").filter(Boolean);
                                  if (e.target.checked) next[idx] = { ...next[idx], tasks: [...current, t].join("\n") };
                                  else next[idx] = { ...next[idx], tasks: current.filter((x) => x !== t).join("\n") };
                                  setExperiences(next);
                                }}
                                className="mt-1 rounded border-slate-400"
                              />
                              <span className="text-slate-700">{t}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      <textarea
                        value={exp.tasks}
                        onChange={(e) => {
                          const next = [...experiences];
                          next[idx] = { ...next[idx], tasks: e.target.value };
                          setExperiences(next);
                        }}
                        placeholder="Her satıra bir madde"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[100px] text-slate-800 resize-y"
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setExperiences([...experiences, { company: "", position: "", duration: "", tasks: "" }])}
                  className="rounded-lg border border-dashed border-slate-400 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  + Deneyim ekle
                </button>
              </div>
            ) : isEducation ? (
              <div className="space-y-3">
                {educationList.length === 0 ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Seviye</label>
                      <select
                        value={value}
                        onChange={(e) => {
                          setValue(e.target.value);
                          if (e.target.value && currentEducationSchool) {
                            const newItem: EducationItem = {
                              level: e.target.value,
                              schoolName: currentEducationSchool || undefined,
                              department: currentEducationDept || undefined,
                              graduationYear: currentEducationYear || undefined,
                            };
                            setEducationList([newItem]);
                          }
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                      >
                        <option value="">Seçin</option>
                        {EDUCATION_LEVELS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Okul adı (opsiyonel)</label>
                      <input
                        type="text"
                        value={currentEducationSchool}
                        onChange={(e) => {
                          onAnswersChange(setAnswerBySaveKey(answers, "education.schoolName", e.target.value));
                          if (value) {
                            const newItem: EducationItem = {
                              level: value,
                              schoolName: e.target.value || undefined,
                              department: currentEducationDept || undefined,
                              graduationYear: currentEducationYear || undefined,
                            };
                            setEducationList([newItem]);
                          }
                        }}
                        placeholder="İsterseniz yazın"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Bölüm / Alan (opsiyonel)</label>
                      <input
                        type="text"
                        value={currentEducationDept}
                        onChange={(e) => {
                          onAnswersChange(setAnswerBySaveKey(answers, "education.department", e.target.value));
                          if (value) {
                            const newItem: EducationItem = {
                              level: value,
                              schoolName: currentEducationSchool || undefined,
                              department: e.target.value || undefined,
                              graduationYear: currentEducationYear || undefined,
                            };
                            setEducationList([newItem]);
                          }
                        }}
                        placeholder="İsterseniz yazın"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Mezuniyet yılı (opsiyonel)</label>
                      <input
                        type="text"
                        value={currentEducationYear}
                        onChange={(e) => {
                          onAnswersChange(setAnswerBySaveKey(answers, "education.graduationYear", e.target.value));
                          if (value) {
                            const newItem: EducationItem = {
                              level: value,
                              schoolName: currentEducationSchool || undefined,
                              department: currentEducationDept || undefined,
                              graduationYear: e.target.value || undefined,
                            };
                            setEducationList([newItem]);
                          }
                        }}
                        placeholder="Örn. 2015"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                      />
                    </div>
                    {value && educationAddMore === "" && (
                      <div className="pt-2 border-t border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Başka bir eğitim eklemek ister misiniz?</label>
                        <select
                          value={educationAddMore}
                          onChange={(e) => {
                            setEducationAddMore(e.target.value);
                            const firstItem: EducationItem = {
                              level: value,
                              schoolName: currentEducationSchool || undefined,
                              department: currentEducationDept || undefined,
                              graduationYear: currentEducationYear || undefined,
                            };
                            if (e.target.value === "Evet") {
                              setEducationList([firstItem]);
                            } else if (e.target.value === "Hayır") {
                              setEducationList([firstItem]);
                            }
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                        >
                          <option value="">Seçin</option>
                          <option value="Evet">Evet</option>
                          <option value="Hayır">Hayır</option>
                        </select>
                      </div>
                    )}
                  </>
                ) : educationAddMore === "Evet" ? (
                  <>
                    {educationList.map((edu, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                        <div className="text-xs font-medium text-slate-600">Eğitim {idx + 1}</div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Seviye</label>
                          <select
                            value={edu.level}
                            onChange={(e) => {
                              const next = [...educationList];
                              next[idx] = { ...next[idx], level: e.target.value };
                              setEducationList(next);
                            }}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                          >
                            <option value="">Seçin</option>
                            {EDUCATION_LEVELS.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Okul adı (opsiyonel)</label>
                          <input
                            type="text"
                            value={edu.schoolName || ""}
                            onChange={(e) => {
                              const next = [...educationList];
                              next[idx] = { ...next[idx], schoolName: e.target.value || undefined };
                              setEducationList(next);
                            }}
                            placeholder="İsterseniz yazın"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Bölüm / Alan (opsiyonel)</label>
                          <input
                            type="text"
                            value={edu.department || ""}
                            onChange={(e) => {
                              const next = [...educationList];
                              next[idx] = { ...next[idx], department: e.target.value || undefined };
                              setEducationList(next);
                            }}
                            placeholder="İsterseniz yazın"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Mezuniyet yılı (opsiyonel)</label>
                          <input
                            type="text"
                            value={edu.graduationYear || ""}
                            onChange={(e) => {
                              const next = [...educationList];
                              next[idx] = { ...next[idx], graduationYear: e.target.value || undefined };
                              setEducationList(next);
                            }}
                            placeholder="Örn. 2015"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                          />
                        </div>
                      </div>
                    ))}
                    {educationAddMore === "Evet" && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEducationList([...educationList, { level: "" }]);
                          }}
                          className="rounded-lg border border-dashed border-slate-400 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          + Eğitim ekle
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-slate-600">Eğitim bilgisi kaydedildi.</div>
                )}
              </div>
            ) : isLanguages ? (
              <div className="space-y-3">
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                >
                  <option value="">Seçin</option>
                  <option value="Hayır">Hayır</option>
                  <option value="Evet">Evet</option>
                </select>
                {value === "Evet" && (
                  <div className="space-y-3 pt-2">
                    {languagesList.map((item, idx) => (
                      <div key={idx} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                        <select
                          value={item.lang}
                          onChange={(e) => {
                            const next = [...languagesList];
                            next[idx] = { ...next[idx], lang: e.target.value };
                            setLanguagesList(next);
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800 flex-1 min-w-[120px]"
                        >
                          <option value="">Dil</option>
                          {COMMON_LANGUAGES.map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                        <select
                          value={item.level}
                          onChange={(e) => {
                            const next = [...languagesList];
                            next[idx] = { ...next[idx], level: e.target.value };
                            setLanguagesList(next);
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800 w-[130px]"
                        >
                          <option value="">Seviye</option>
                          {LANGUAGE_LEVELS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setLanguagesList([...languagesList, { lang: "", level: "" }])}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      + Dil ekle
                    </button>
                  </div>
                )}
              </div>
            ) : isDrivingLicense ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {DRIVING_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={drivingLicenses.includes(opt)}
                        onChange={(e) => {
                          if (opt === "Yok") {
                            if (e.target.checked) {
                              setDrivingLicenses(["Yok"]);
                            } else {
                              setDrivingLicenses([]);
                            }
                          } else {
                            if (e.target.checked) {
                              setDrivingLicenses(drivingLicenses.filter((x) => x !== "Yok").concat(opt));
                            } else {
                              setDrivingLicenses(drivingLicenses.filter((x) => x !== opt));
                            }
                          }
                        }}
                        className="rounded border-slate-400"
                      />
                      <span className="text-slate-800">{opt}</span>
                    </label>
                  ))}
                </div>
                {drivingLicenses.includes("Diğer") && (
                  <input
                    type="text"
                    value={drivingLicenseOther}
                    onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "mobility.drivingLicenseOther", e.target.value))}
                    placeholder="Açıklayın"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                  />
                )}
              </div>
            ) : isPassport ? (
              <div className="space-y-3">
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                >
                  <option value="">Seçin</option>
                  <option value="Yok">Yok</option>
                  <option value="Var (geçerli)">Var (geçerli)</option>
                  <option value="Var (süresi dolmak üzere)">Var (süresi dolmak üzere)</option>
                </select>
                {(value === "Var (geçerli)" || value === "Var (süresi dolmak üzere)") && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Pasaport türü (opsiyonel)</label>
                      <select
                        value={passportType}
                        onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "mobility.passportType", e.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                      >
                        <option value="">Seçin</option>
                        {PASSPORT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Son geçerlilik tarihi (opsiyonel)</label>
                      <input
                        type="text"
                        value={passportExpiry}
                        onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "mobility.passportExpiry", e.target.value))}
                        placeholder="AA.YYYY veya YYYY"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Vize durumu (opsiyonel)</label>
                      <input
                        type="text"
                        value={visaNote}
                        onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "mobility.visaNote", e.target.value))}
                        placeholder="Örn: Schengen var, Süreçte, Yok"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : isCertificates ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">İpucu: Sertifika adı, yıl ve kurum (isterseniz).</span>
                  <button
                    type="button"
                    onClick={() => setCertExamplesOpen((o) => !o)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Örnekler
                  </button>
                </div>
                {certExamplesOpen && (
                  <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    {CERT_EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => {
                          setCertificatesList([...certificatesList, { name: ex }]);
                          setCertExamplesOpen(false);
                        }}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
                {certificatesList.map((cert, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-3 space-y-2">
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => {
                        const next = [...certificatesList];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setCertificatesList(next);
                      }}
                      placeholder="Sertifika adı"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={cert.year ?? ""}
                        onChange={(e) => {
                          const next = [...certificatesList];
                          next[idx] = { ...next[idx], year: e.target.value };
                          setCertificatesList(next);
                        }}
                        placeholder="Yıl"
                        className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 text-slate-800"
                      />
                      <input
                        type="text"
                        value={cert.org ?? ""}
                        onChange={(e) => {
                          const next = [...certificatesList];
                          next[idx] = { ...next[idx], org: e.target.value };
                          setCertificatesList(next);
                        }}
                        placeholder="Kurum"
                        className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 text-slate-800"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCertificatesList([...certificatesList, { name: "" }])}
                  className="rounded-lg border border-dashed border-slate-400 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  + Sertifika ekle
                </button>
              </div>
            ) : isSalaryNote ? (
              <div className="space-y-3">
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                >
                  <option value="">Seçin</option>
                  <option value="Yazmak istemiyorum">Yazmak istemiyorum</option>
                  <option value="Görüşmede konuşmak istiyorum">Görüşmede konuşmak istiyorum</option>
                  <option value="Net maaş yazmak istiyorum">Net maaş yazmak istiyorum</option>
                  <option value="Maaş aralığı yazmak istiyorum">Maaş aralığı yazmak istiyorum</option>
                </select>
                {value === "Net maaş yazmak istiyorum" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={salaryAmount}
                      onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "work.salaryAmount", e.target.value))}
                      placeholder="Tutar"
                      className="rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                    />
                    <select
                      value={salaryCurrency}
                      onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "work.salaryCurrency", e.target.value))}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
                {value === "Maaş aralığı yazmak istiyorum" && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={salaryMin}
                      onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "work.salaryMin", e.target.value))}
                      placeholder="Min"
                      className="rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={salaryMax}
                      onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "work.salaryMax", e.target.value))}
                      placeholder="Max"
                      className="rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                    />
                    <select
                      value={salaryCurrency}
                      onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "work.salaryCurrency", e.target.value))}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px] text-slate-800"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : isFinalNote ? (
              <>
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="İsterseniz ekleyin"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 text-slate-800 placeholder:text-slate-400 min-h-[140px] resize-y"
                  rows={6}
                />
              </>
            ) : currentQ.type === "select" ? (
              <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 text-slate-800 min-h-[44px]"
                aria-label={currentQ.question}
              >
                <option value="">Seçin</option>
                {selectOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={isEmailStep ? "email" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={currentQ.examples[0] || ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 text-slate-800 placeholder:text-slate-400 min-h-[44px]"
              />
            )}
          </motion.div>
        )}

        {phase === "countryJob" && (
          <motion.div
            key="countryJob"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto w-full max-w-[540px] rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center sm:text-left">Hedef ülke ve meslek</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Ülke</label>
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Ülke ara..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px]"
                />
                <select
                  value={country}
                  onChange={(e) => onCountryChange(e.target.value)}
                  aria-label="Ülke seçin"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px]"
                >
                  <option value="">Seçin</option>
                  {COUNTRIES.filter((c) =>
                    c.name.toLowerCase().includes(countrySearch.trim().toLowerCase())
                  ).map((c) => (
                    <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Meslek alanı</label>
                <input
                  type="text"
                  value={jobAreaSearch}
                  onChange={(e) => setJobAreaSearch(e.target.value)}
                  placeholder="Alan ara..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px]"
                />
                <select
                  value={jobArea}
                  onChange={(e) => {
                    onJobAreaChange(e.target.value);
                    onJobBranchChange("");
                  }}
                  aria-label="Meslek alanı seçin"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:ring-offset-1 min-h-[44px]"
                >
                  <option value="">Seçin</option>
                  {PROFESSION_AREAS.filter((a) =>
                    a.name.toLowerCase().includes(jobAreaSearch.trim().toLowerCase())
                  ).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "photo" && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
      <div
        className="shrink-0 sticky bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 py-2 sm:py-2"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        {footerButtons}
      </div>
    </div>
  );
}
