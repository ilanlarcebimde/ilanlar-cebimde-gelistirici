"use client";

import { useState, useEffect } from "react";
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
import { getTasksForProfessionTitle, getSkillsForBranch } from "@/data/professionLibrary";
import { PhotoUpload } from "./PhotoUpload";
import { Lightbulb } from "lucide-react";

const DURATION_OPTIONS = ["0–6 ay", "6–12 ay", "1–3 yıl", "3–5 yıl", "5+ yıl"];
const EDUCATION_LEVELS = ["İlkokul", "Ortaokul", "Lise", "Meslek lisesi", "Ön lisans", "Lisans", "Diğer"];
const LANGUAGE_LEVELS = ["Başlangıç", "Orta", "İyi", "Çok iyi"];
const COMMON_LANGUAGES = ["Almanca", "İngilizce", "Fransızca", "Arapça", "Rusça", "Hollandaca", "Diğer"];
const DRIVING_OPTIONS = ["Yok", "A", "B", "C", "CE", "D", "Diğer"];
const CERT_EXAMPLES = ["MYK Mesleki Yeterlilik", "Ustalık belgesi", "Hijyen belgesi", "İSG eğitimi", "Forklift belgesi"];
const CURRENCIES = ["TRY", "EUR", "USD", "GBP"];

const QUESTIONS = getQuestionsFor("form");

/** Formda e-posta formatı kontrolü */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(s: string): boolean {
  return EMAIL_REGEX.test(s.trim());
}

type Phase = "questions" | "countryJob" | "photo";

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
  const [phase, setPhase] = useState<Phase>("questions");
  const [step, setStep] = useState(0);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [professionSearch, setProfessionSearch] = useState("");
  const [suggestedTasksForIndex, setSuggestedTasksForIndex] = useState<number | null>(null);
  const [certExamplesOpen, setCertExamplesOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [jobAreaSearch, setJobAreaSearch] = useState("");
  const [jobBranchSearch, setJobBranchSearch] = useState("");

  const currentQ = QUESTIONS[step];
  const value = currentQ ? getAnswerBySaveKey(answers, currentQ.saveKey) : "";
  const isJobTitle = currentQ?.id === "job_title";
  const isWorkSummary = currentQ?.id === "work_summary";
  const isEducation = currentQ?.id === "education";
  const isLanguages = currentQ?.id === "languages";
  const isDrivingLicense = currentQ?.id === "driving_license";
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

  const languagesList = (getAnswerBySaveKeyValue(answers, "languages.list") as { lang: string; level: string }[] | undefined) ?? [];
  const setLanguagesList = (arr: { lang: string; level: string }[]) => {
    onAnswersChange(setAnswerBySaveKeyValue(answers, "languages.list", arr));
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

  type CertItem = { name: string; year?: string; org?: string };
  const certificatesList = (getAnswerBySaveKeyValue(answers, "certificates.list") as CertItem[] | undefined) ?? [];
  const setCertificatesList = (arr: CertItem[]) => {
    onAnswersChange(setAnswerBySaveKeyValue(answers, "certificates.list", arr));
  };

  const salaryAmount = getAnswerBySaveKey(answers, "work.salaryAmount");
  const salaryMin = getAnswerBySaveKey(answers, "work.salaryMin");
  const salaryMax = getAnswerBySaveKey(answers, "work.salaryMax");
  const salaryCurrency = getAnswerBySaveKey(answers, "work.salaryCurrency") || "EUR";

  const suggestedSkills = (getAnswerBySaveKeyValue(answers, "work.suggestedSkills") as string[] | undefined) ?? [];
  const setSuggestedSkills = (arr: string[]) => {
    onAnswersChange(setAnswerBySaveKeyValue(answers, "work.suggestedSkills", arr));
  };
  const skillsResult = jobArea && jobBranch ? getSkillsForBranch(jobArea, jobBranch) : null;
  const toggleSkill = (skill: string) => {
    if (suggestedSkills.includes(skill)) setSuggestedSkills(suggestedSkills.filter((s) => s !== skill));
    else setSuggestedSkills([...suggestedSkills, skill]);
  };

  useEffect(() => {
    if (!jobArea || !jobBranch) return;
    const res = getSkillsForBranch(jobArea, jobBranch);
    if (suggestedSkills.length === 0 && res.skillRules.defaultSelect.length > 0) {
      setSuggestedSkills(res.skillRules.defaultSelect);
    }
  }, [jobArea, jobBranch, suggestedSkills.length]);

  const setValue = (v: string) => {
    if (!currentQ) return;
    onAnswersChange(setAnswerBySaveKey(answers, currentQ.saveKey, v));
  };

  const goNext = () => {
    setSuggestionsOpen(false);
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

  const isFormRequired = currentQ ? (currentQ.formRequired ?? currentQ.required) : false;
  const isEmailStep = currentQ?.saveKey === "personal.email";

  const canNext = () => {
    if (phase === "questions" && currentQ) {
      if (isFormRequired && !value.trim()) return false;
      if (isEmailStep && isFormRequired && value.trim()) return isValidEmail(value);
      if (isFormRequired) return value.trim().length > 0;
    }
    if (phase === "countryJob") return country && jobBranch;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Progress: Soru X / 26 */}
      {phase === "questions" && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Soru {step + 1} / {QUESTIONS.length}</span>
          <div className="h-2 flex-1 max-w-[200px] ml-4 rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              className="h-full bg-slate-700 rounded-full"
              initial={false}
              animate={{ width: `${QUESTIONS.length > 0 ? ((step + 1) / QUESTIONS.length) * 100 : 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "questions" && currentQ && (
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
          >
            <h2 className="text-lg font-medium text-slate-900 mb-2">{currentQ.question}</h2>
            {(currentQ.formHint ?? currentQ.hint) && (
              <p className="flex items-start gap-1.5 text-sm text-slate-500 mb-3">
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" aria-hidden />
                <span>{currentQ.formHint ?? currentQ.hint}</span>
              </p>
            )}
            {(currentQ.examples?.length ?? 0) > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSuggestionsOpen((o) => !o)}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Öneriler {suggestionsOpen ? "▼" : "▶"}
                </button>
              </div>
            )}
            {suggestionsOpen && (currentQ.examples?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                {(currentQ.examples ?? []).slice(0, 4).map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      if (isJobTitle) return;
                      if (isFinalNote) setValue(value ? value + "\n" + ex : ex);
                      else setValue(ex);
                    }}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
            {currentQ.type === "multiline" ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={currentQ.examples[0] || "Yanıtınızı yazın..."}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 min-h-[140px] resize-y"
                rows={6}
              />
            ) : isJobTitle ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={professionSearch}
                  onChange={(e) => setProfessionSearch(e.target.value)}
                  placeholder="Meslek ara..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 min-h-[44px]"
                />
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 min-h-[44px]"
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 min-h-[44px]"
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
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[44px] text-slate-800"
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
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[44px] text-slate-800"
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
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[44px] text-slate-800"
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
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[100px] text-slate-800 resize-y"
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seviye</label>
                  <select
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
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
                    value={getAnswerBySaveKey(answers, "education.schoolName")}
                    onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "education.schoolName", e.target.value))}
                    placeholder="İsterseniz yazın"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Bölüm / Alan (opsiyonel)</label>
                  <input
                    type="text"
                    value={getAnswerBySaveKey(answers, "education.department")}
                    onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "education.department", e.target.value))}
                    placeholder="İsterseniz yazın"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Mezuniyet yılı (opsiyonel)</label>
                  <input
                    type="text"
                    value={getAnswerBySaveKey(answers, "education.graduationYear")}
                    onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "education.graduationYear", e.target.value))}
                    placeholder="Örn. 2015"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
                  />
                </div>
              </div>
            ) : isLanguages ? (
              <div className="space-y-3">
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
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
                          className="rounded-lg border border-slate-300 px-3 py-2 min-h-[44px] text-slate-800 flex-1 min-w-[120px]"
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
                          className="rounded-lg border border-slate-300 px-3 py-2 min-h-[44px] text-slate-800 w-[130px]"
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
                    <label key={opt} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={drivingLicenses.includes(opt)}
                        onChange={(e) => {
                          if (e.target.checked) setDrivingLicenses([...drivingLicenses, opt]);
                          else setDrivingLicenses(drivingLicenses.filter((x) => x !== opt));
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
                  />
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
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[44px] text-slate-800"
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
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
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
                        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
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
                      className="rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
                    />
                    <select
                      value={salaryCurrency}
                      onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "work.salaryCurrency", e.target.value))}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
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
                      className="rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={salaryMax}
                      onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "work.salaryMax", e.target.value))}
                      placeholder="Max"
                      className="rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
                    />
                    <select
                      value={salaryCurrency}
                      onChange={(e) => onAnswersChange(setAnswerBySaveKey(answers, "work.salaryCurrency", e.target.value))}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 min-h-[44px] text-slate-800"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 min-h-[140px] resize-y"
                  rows={6}
                />
              </>
            ) : currentQ.type === "select" ? (
              <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 min-h-[44px]"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 min-h-[44px]"
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
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Hedef ülke ve meslek</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ülke</label>
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Ülke ara..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-1 text-slate-800 min-h-[44px]"
                />
                <select
                  value={country}
                  onChange={(e) => onCountryChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 min-h-[44px]"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Meslek alanı</label>
                <input
                  type="text"
                  value={jobAreaSearch}
                  onChange={(e) => setJobAreaSearch(e.target.value)}
                  placeholder="Alan ara..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-1 text-slate-800 min-h-[44px]"
                />
                <select
                  value={jobArea}
                  onChange={(e) => {
                    onJobAreaChange(e.target.value);
                    onJobBranchChange("");
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 min-h-[44px]"
                >
                  <option value="">Seçin</option>
                  {PROFESSION_AREAS.filter((a) =>
                    a.name.toLowerCase().includes(jobAreaSearch.trim().toLowerCase())
                  ).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              {jobArea && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meslek dalı</label>
                  <input
                    type="text"
                    value={jobBranchSearch}
                    onChange={(e) => setJobBranchSearch(e.target.value)}
                    placeholder="Dal ara..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-1 text-slate-800 min-h-[44px]"
                  />
                  <select
                    value={jobBranch}
                    onChange={(e) => onJobBranchChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 min-h-[44px]"
                  >
                    <option value="">Seçin</option>
                    {(PROFESSION_AREAS.find((a) => a.id === jobArea)?.branches ?? [])
                      .filter((b) => b.toLowerCase().includes(jobBranchSearch.trim().toLowerCase()))
                      .map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                  </select>
                </div>
              )}
            </div>
            {skillsResult && jobBranch && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-medium text-slate-800 mb-2">Beceri önerileri (6–12 seçebilirsiniz)</h4>
                <div className="flex flex-wrap gap-2">
                  {skillsResult.skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        suggestedSkills.includes(skill)
                          ? "border-slate-700 bg-slate-700 text-white"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

      <div className="flex justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          disabled={(phase === "questions" && step === 0)}
          className="rounded-xl border border-slate-300 px-6 py-3 text-slate-700 font-medium disabled:opacity-50"
        >
          Geri
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={phase === "questions" && isFormRequired ? (isEmailStep ? !value?.trim() || !isValidEmail(value) : !value?.trim()) : phase === "countryJob" ? !country || !jobBranch : false || isCompleting}
          className="rounded-xl bg-slate-800 px-6 py-3 text-white font-medium disabled:opacity-50"
        >
          {isCompleting
            ? "Kaydediliyor…"
            : phase === "questions" && step < QUESTIONS.length - 1
            ? "İleri"
            : phase === "questions"
            ? "Devam et"
            : phase === "countryJob"
            ? "Devam et — Fotoğraf"
            : "Tamamla"}
        </button>
      </div>
    </div>
  );
}
