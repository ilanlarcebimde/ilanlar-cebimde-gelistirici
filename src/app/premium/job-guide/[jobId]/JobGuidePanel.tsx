"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FLOW_STEPS, type FlowStepDef } from "./flowSteps";
import { JobGuideFlowModal } from "./JobGuideFlowModal";
import {
  getGuideBySource,
  TRANSLATION_GUIDE_TITLE,
  TRANSLATION_GUIDE_CONTENT,
  DOCUMENTS_INTRO,
  DOCUMENTS_EUROPE_TITLE,
  DOCUMENTS_EUROPE_CONTENT,
  DOCUMENTS_ARAB_TITLE,
  DOCUMENTS_ARAB_CONTENT,
  DOCUMENTS_AMERICA_TITLE,
  DOCUMENTS_AMERICA_CONTENT,
  getRegionFromLocation,
  getPassportVisaContentForCountry,
  getSalaryLifeContentForCountry,
  CV_IMPORTANCE_TITLE,
  CV_IMPORTANCE_ITEMS,
  CV_PACKAGE_URL,
  CV_PACKAGE_ITEMS,
  CV_COUPON_TEXT,
} from "./guideContent";

type Job = {
  id: string;
  title: string | null;
  position_text: string | null;
  location_text: string | null;
  source_name: string | null;
  source_url?: string | null;
};

type Guide = {
  id: string;
  job_post_id: string;
  status: string;
  progress_step: number;
  answers_json: Record<string, unknown>;
};

export function JobGuidePanel({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [flowModalOpen, setFlowModalOpen] = useState(false);

  const fetchPanel = useCallback(async () => {
    if (!user?.id || !jobId) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/premium/panel/${encodeURIComponent(jobId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        const code = err?.error;
        const msg = code === "job_posts_fetch_failed"
          ? "İlan verisi yüklenemedi. Lütfen başvuru paneline dönüp tekrar deneyin."
          : code === "Not found" || res.status === 404
            ? "Bu ilan bulunamadı."
            : code === "supabase_admin_not_configured"
              ? "Sunucu yapılandırma hatası. Lütfen daha sonra tekrar deneyin."
              : err?.error ?? "Yüklenemedi";
        setError(msg);
        return;
      }
      const data = (await res.json()) as { job: Job; guide: Guide };
      setJob(data.job);
      setGuide(data.guide);
      const existing = (data.guide?.answers_json ?? {}) as Record<string, unknown>;
      setAnswers(existing);
      const firstUnanswered = FLOW_STEPS.findIndex((s) => existing[s.answerKey] == null || (s.type === "multiselect" && !Array.isArray(existing[s.answerKey])));
      setStepIndex(firstUnanswered >= 0 ? firstUnanswered : FLOW_STEPS.length);
      if (data.guide?.answers_json && typeof (data.guide.answers_json as Record<string, unknown>).services_selected !== "undefined") {
        const svc = (data.guide.answers_json as Record<string, unknown>).services_selected;
        setMultiSelected(Array.isArray(svc) ? (svc as string[]) : []);
      }
      const hasUnfinished = firstUnanswered >= 0 && firstUnanswered < FLOW_STEPS.length;
      setFlowModalOpen(hasUnfinished);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, [user?.id, jobId]);

  useEffect(() => {
    fetchPanel();
  }, [fetchPanel]);

  const saveAndNext = useCallback(
    async (value: unknown) => {
      if (!guide || !user) return;
      const step = FLOW_STEPS[stepIndex];
      if (!step) return;
      const nextAnswers = { ...answers, [step.answerKey]: value };
      setAnswers(nextAnswers);
      setSaving(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch("/api/job-guide", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ jobGuideId: guide.id, answers_json: nextAnswers, progress_step: stepIndex + 2 }),
        });
        if (!res.ok) throw new Error("Kayıt başarısız");
        setStepIndex((i) => i + 1);
        setMultiSelected([]);
      } catch {
        setError("Kaydedilirken hata oluştu.");
      } finally {
        setSaving(false);
      }
    },
    [guide, user, stepIndex, answers]
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-4">
        <p className="text-slate-600">Yükleniyor…</p>
      </div>
    );
  }
  if (error || !job || !guide) {
    return (
      <div className="mx-auto max-w-lg p-4 text-center">
        <p className="text-red-600">{error ?? "İlan bulunamadı."}</p>
        <Link href="/premium/job-guides" className="mt-4 inline-block text-brand-600 hover:underline">
          Başvuru paneline dön
        </Link>
      </div>
    );
  }

  const step = FLOW_STEPS[stepIndex];
  const isDone = stepIndex >= FLOW_STEPS.length;
  const sourceGuide = getGuideBySource(job.source_name);
  const passportVisaGuide = getPassportVisaContentForCountry(job.location_text);
  const salaryLifeGuide = getSalaryLifeContentForCountry(job.location_text);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <JobGuideFlowModal
        open={flowModalOpen}
        onClose={() => setFlowModalOpen(false)}
        jobId={jobId}
        guideId={guide.id}
        initialStepIndex={stepIndex}
        initialAnswers={answers}
        onComplete={() => {
          setFlowModalOpen(false);
          fetchPanel();
        }}
      />
      <Link href="/premium/job-guides" className="mb-4 inline-block text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Başvuru Paneli
      </Link>
      {!flowModalOpen && (
        <button
          type="button"
          onClick={() => setFlowModalOpen(true)}
          className="mb-2 ml-3 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
        >
          Soru akışı (modal)
        </button>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{job.title ?? "İlan"}</h1>
        {job.location_text && <p className="mt-1 text-sm text-slate-500">{job.location_text}</p>}

        {/* Adım adım: sadece o anki adıma ait içerik gösterilir (stepIndex === N) */}
        {stepIndex === 0 && sourceGuide && (
          <section className="mt-6 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5" aria-label="Başvuru rehberi">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">{sourceGuide.title}</h2>
            <div className="mt-3 prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 sm:text-[15px]">
              <GuideText content={sourceGuide.content} />
            </div>
          </section>
        )}

        {stepIndex === 1 && answers.want_translation === "Evet" && (
          <section className="mt-6 rounded-xl border border-slate-100 bg-sky-50/50 p-4 sm:p-5" aria-label="Türkçe çeviri rehberi">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">{TRANSLATION_GUIDE_TITLE}</h2>
            <div className="mt-3 prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 sm:text-[15px]">
              <GuideText content={TRANSLATION_GUIDE_CONTENT} />
            </div>
          </section>
        )}

        {stepIndex === 1 && (() => {
          const region = getRegionFromLocation(job.location_text);
          const regionLabel = region === "europe" ? "Avrupa" : region === "arab" ? "Arap ülkeleri" : region === "america" ? "Amerika / Kanada" : null;
          return (
            <section className="mt-6 rounded-xl border border-slate-200 bg-amber-50/50 p-4 sm:p-5" aria-label="İstenebilecek belgeler">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">İstenebilecek Belgeler (Bölgeye Göre)</h2>
              <p className="mt-1 text-sm text-slate-600">{DOCUMENTS_INTRO}</p>
              {region && regionLabel && (
                <p className="mt-1 text-sm font-medium text-brand-700">
                  İlanınızın bölgesi: {regionLabel}
                </p>
              )}
              <div className="mt-4 space-y-6 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                {region === "europe" && <DocumentBlock title={DOCUMENTS_EUROPE_TITLE} content={DOCUMENTS_EUROPE_CONTENT} />}
                {region === "arab" && <DocumentBlock title={DOCUMENTS_ARAB_TITLE} content={DOCUMENTS_ARAB_CONTENT} />}
                {region === "america" && <DocumentBlock title={DOCUMENTS_AMERICA_TITLE} content={DOCUMENTS_AMERICA_CONTENT} />}
                {!region && (
                  <p className="text-slate-600">İlan konumundan bölge tespit edilemedi. Konumda ülke veya bölge adı (ör. Avrupa, İrlanda, Katar, ABD) belirtilmiş ilanlar için ilgili belge listesi gösterilir.</p>
                )}
              </div>
            </section>
          );
        })()}

        {stepIndex === 2 && answers.want_passport_visa === "Evet" && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-violet-50/50 p-4 sm:p-5" aria-label="Pasaport ve vize rehberi">
            {passportVisaGuide ? (
              <>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">{passportVisaGuide.title}</h2>
                <div className="mt-3 prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                  <GuideText content={passportVisaGuide.content} />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">Bu ilanın ülkesi için pasaport ve vize rehberi şu an mevcut değil. İlan konumunda Katar, İrlanda, Belçika veya ABD belirtilmiş ilanlar için rehber sunulmaktadır.</p>
            )}
          </section>
        )}

        {stepIndex === 3 && answers.want_salary_life === "Evet" && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-emerald-50/50 p-4 sm:p-5" aria-label="Maaş ve yaşam gider hesabı">
            {salaryLifeGuide ? (
              <>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">{salaryLifeGuide.title}</h2>
                <div className="mt-3 prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                  <GuideText content={salaryLifeGuide.content} />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">Bu ilanın ülkesi için maaş ve yaşam gider rehberi şu an mevcut değil. İlan konumunda Katar, İrlanda, Belçika veya ABD/Alaska belirtilmiş ilanlar için rehber sunulmaktadır.</p>
            )}
          </section>
        )}

        {isDone ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
              <p className="font-medium">Tercihleriniz kaydedildi.</p>
              <p className="mt-1 text-sm">Bu ilan için rehberiniz panelde görünecek.</p>
              <Link
                href="/premium/job-guides"
                className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Panele dön
              </Link>
            </div>
            {answers.cv_ready === "Hayır" && (
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5" aria-label="CV paketi önerisi">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">{CV_IMPORTANCE_TITLE}</h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                  {CV_IMPORTANCE_ITEMS.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 font-semibold text-brand-600">{i + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={CV_PACKAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 sm:w-auto sm:min-w-[200px]"
                >
                  Yurtdışı CV Paketi — 349 TL
                </a>
                <ul className="mt-4 space-y-1 text-sm text-slate-600">
                  {CV_PACKAGE_ITEMS.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-emerald-600" aria-hidden>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-500">{CV_COUPON_TEXT}</p>
              </section>
            )}
          </div>
        ) : step ? (
          <StepBlock
            step={step}
            answers={answers}
            multiSelected={multiSelected}
            setMultiSelected={setMultiSelected}
            onAnswer={saveAndNext}
            saving={saving}
          />
        ) : null}
      </div>
    </div>
  );
}

/** Bölge belge listesi: başlık + içerik (GuideText ile). */
function DocumentBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 sm:p-4">
      <h3 className="text-sm font-bold text-slate-800 sm:text-base">{title}</h3>
      <div className="mt-2">
        <GuideText content={content} />
      </div>
    </div>
  );
}

/** Rehber metnini paragraf ve **kalın** için render eder. */
function GuideText({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <>
      {paragraphs.map((para, i) => {
        const parts: React.ReactNode[] = [];
        let rest = para;
        let key = 0;
        while (rest.length > 0) {
          const boldStart = rest.indexOf("**");
          if (boldStart === -1) {
            parts.push(<span key={key++}>{rest}</span>);
            break;
          }
          if (boldStart > 0) parts.push(<span key={key++}>{rest.slice(0, boldStart)}</span>);
          const boldEnd = rest.indexOf("**", boldStart + 2);
          if (boldEnd === -1) {
            parts.push(<span key={key++}>{rest.slice(boldStart)}</span>);
            break;
          }
          parts.push(<strong key={key++} className="font-semibold text-slate-800">{rest.slice(boldStart + 2, boldEnd)}</strong>);
          rest = rest.slice(boldEnd + 2);
        }
        return <p key={i} className="mb-2 last:mb-0">{parts}</p>;
      })}
    </>
  );
}

function StepBlock({
  step,
  answers,
  multiSelected,
  setMultiSelected,
  onAnswer,
  saving,
}: {
  step: FlowStepDef;
  answers: Record<string, unknown>;
  multiSelected: string[];
  setMultiSelected: (v: string[]) => void;
  onAnswer: (value: unknown) => void;
  saving: boolean;
}) {
  const currentValue = answers[step.answerKey];

  if (step.type === "multiselect") {
    const options = step.options ?? [];
    const handleToggle = (value: string) => {
      const next = multiSelected.includes(value) ? multiSelected.filter((x) => x !== value) : [...multiSelected, value];
      setMultiSelected(next);
    };
    const handleSubmit = () => {
      if (multiSelected.length > 0) onAnswer(multiSelected);
    };
    return (
      <div className="mt-6">
        <p className="mb-3 font-medium text-slate-900">{step.question}</p>
        <ul className="space-y-2">
          {options.map((opt) => (
            <li key={opt.value}>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input
                  type="checkbox"
                  checked={multiSelected.includes(opt.value)}
                  onChange={() => handleToggle(opt.value)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-slate-800 sm:text-base">{opt.label}</span>
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || multiSelected.length === 0}
          className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 sm:w-auto sm:min-w-[140px]"
        >
          {saving ? "Kaydediliyor…" : "Devam"}
        </button>
      </div>
    );
  }

  if (step.type === "choice") {
    const options = step.options ?? [];
    return (
      <div className="mt-6">
        <p className="mb-3 font-medium text-slate-900">{step.question}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onAnswer(opt.value)}
              disabled={saving}
              className={`min-h-[44px] rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition sm:px-5 ${
                currentValue === opt.value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
