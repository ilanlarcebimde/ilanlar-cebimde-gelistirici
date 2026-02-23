"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ReportViewer, type ReportJson } from "@/components/premium/ReportViewer";
import type { JobSummary } from "@/components/premium/JobSummaryCard";
import {
  buildChecklist,
  calcProgress,
  answersFromJson,
  getMissingTop,
  type Answers,
  type ChecklistModule,
} from "./checklistRules";

type JobGuide = {
  id: string;
  user_id: string;
  job_post_id: string;
  status: string;
  progress_step: number;
  answers_json: Record<string, unknown>;
  report_json: ReportJson | null;
  report_md: string | null;
  updated_at: string;
};

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "az önce";
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
}

function JobNotFoundShell({ jobId }: { jobId: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <p className="text-amber-600 font-medium mb-2">Bu ilan bulunamadı</p>
        <p className="text-sm text-slate-600 mb-6">
          İlan kaldırılmış veya erişilemiyor olabilir. Başka bir ilandan &quot;Nasıl Başvururum?&quot; ile başlayabilirsiniz.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/premium/job-guides"
            className="rounded-xl bg-slate-800 px-4 py-3 font-medium text-white hover:bg-slate-700"
          >
            Başvuru Paneline Dön
          </Link>
          <Link
            href="/ucretsiz-yurtdisi-is-ilanlari"
            className="rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            İlanlara Git
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingShell({ jobId }: { jobId: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/premium/job-guides" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Başvuru Paneli
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-lg font-bold text-slate-900">Premium Başvuru Paneli</h1>
        <p className="mt-2 text-slate-600">İlan yükleniyor…</p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Soru 1: Pasaportun var mı?</p>
          <p className="mt-2 text-xs text-slate-400">Kontrol listesi ve soru-cevap yükleniyor…</p>
        </div>
      </main>
    </div>
  );
}

export function JobGuideClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<JobSummary | null>(null);
  const [guide, setGuide] = useState<JobGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportUpdating, setReportUpdating] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [selectedModuleId, setSelectedModuleId] = useState<string>("passport");
  const [toast, setToast] = useState<string | null>(null);
  const [lastReportUpdate, setLastReportUpdate] = useState<string | null>(null);
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [jobLoadError, setJobLoadError] = useState(false);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<Answers | null>(null);

  useEffect(() => {
    console.log("JOB GUIDE MOUNT", jobId);
  }, [jobId]);

  useEffect(() => {
    if (guide?.report_json) setReportViewOpen(true);
  }, [guide?.report_json]);

  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, []);

  const getSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  useEffect(() => {
    setJob(null);
    setGuide(null);
    setLoading(true);
    setJobLoadError(false);
    setAnswers({});

    let cancelled = false;

    async function run() {
      const token = await getSession();
      if (!token || cancelled) return;

      const trimmedId = String(jobId).trim();
      if (!trimmedId) {
        if (!cancelled) {
          setJobLoadError(true);
          setLoading(false);
        }
        return;
      }

      let panelRes = await fetch(`/api/premium/panel/${trimmedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cancelled) return;
      if (panelRes.status === 404) {
        await new Promise((r) => setTimeout(r, 1000));
        if (cancelled) return;
        panelRes = await fetch(`/api/premium/panel/${trimmedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (cancelled) return;
      if (panelRes.ok) {
        const { job: jobData, guide: guideData } = (await panelRes.json()) as { job: JobSummary; guide: JobGuide };
        if (!cancelled) {
          setJob(jobData);
          if (guideData) {
            setGuide(guideData);
            setAnswers(answersFromJson((guideData.answers_json as Record<string, unknown>) ?? {}));
          }
          setLoading(false);
        }
        return;
      }

      if (panelRes.status === 404 || panelRes.status === 500) {
        const fallbackJobRes = await fetch(`/api/job-posts/${trimmedId}`);
        if (cancelled) return;
        if (fallbackJobRes.ok) {
          const jobData = (await fallbackJobRes.json()) as JobSummary;
          const guideRes = await fetch(`/api/job-guide?jobPostId=${encodeURIComponent(trimmedId)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          let guideData: JobGuide | null = null;
          if (guideRes.ok) {
            guideData = (await guideRes.json()) as JobGuide;
          } else {
            const createRes = await fetch("/api/job-guide", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ jobPostId: trimmedId }),
            });
            if (createRes.ok) guideData = (await createRes.json()) as JobGuide;
          }
          if (!cancelled && guideData) {
            setJob(jobData);
            setGuide(guideData);
            setAnswers(answersFromJson((guideData.answers_json as Record<string, unknown>) ?? {}));
          }
          if (!cancelled) setLoading(false);
          return;
        }
      }

      const { data: clientJob } = await supabase
        .from("job_posts")
        .select("id, title, position_text, location_text, source_name, source_url, snippet, published_at")
        .eq("id", trimmedId)
        .eq("status", "published")
        .maybeSingle();
      if (cancelled) return;
      if (clientJob) {
        const jobData = clientJob as JobSummary;
        const guideRes = await fetch(`/api/job-guide?jobPostId=${encodeURIComponent(trimmedId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let guideData: JobGuide | null = null;
        if (guideRes.ok) {
          guideData = (await guideRes.json()) as JobGuide;
        } else {
          const createRes = await fetch("/api/job-guide", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ jobPostId: trimmedId }),
          });
          if (createRes.ok) guideData = (await createRes.json()) as JobGuide;
        }
        if (!cancelled && guideData) {
          setJob(jobData);
          setGuide(guideData);
          setAnswers(answersFromJson((guideData.answers_json as Record<string, unknown>) ?? {}));
        }
        if (!cancelled) setLoading(false);
        return;
      }

      console.warn("[JobGuideClient] panel fetch failed", { jobId: trimmedId, status: panelRes.status });
      if (!cancelled) {
        setJobLoadError(true);
        setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [jobId, getSession, router]);

  const jobForChecklist = useMemo(
    () => (job ? { id: job.id, title: job.title, location_text: job.location_text, source_name: job.source_name, source_url: job.source_url, snippet: (job as { snippet?: string }).snippet } : null),
    [job]
  );
  const modules = useMemo(() => buildChecklist(jobForChecklist, answers), [jobForChecklist, answers]);
  const progress = useMemo(() => calcProgress(modules), [modules]);
  const selectedModule = useMemo(() => modules.find((m) => m.id === selectedModuleId) ?? modules[0], [modules, selectedModuleId]);
  const missingTop3 = useMemo(() => getMissingTop(modules, 3), [modules]);
  const baseUnlocked = Boolean(answers.passport && answers.cv);

  const saveAnswers = useCallback(
    async (newAnswers: Answers): Promise<boolean> => {
      if (!guide) return false;
      const token = await getSession();
      if (!token) return false;
      const res = await fetch("/api/job-guide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobGuideId: guide.id, answers_json: newAnswers }),
      });
      if (res.ok) setGuide((g) => (g ? { ...g, answers_json: newAnswers as unknown as Record<string, unknown> } : null));
      return res.ok;
    },
    [guide, getSession]
  );

  const scheduleSave = useCallback(
    (nextAnswers: Answers) => {
      pendingSaveRef.current = nextAnswers;
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(async () => {
        const toSave = pendingSaveRef.current;
        saveDebounceRef.current = null;
        if (!toSave) return;
        setSaveStatus("saving");
        try {
          const ok = await saveAnswers(toSave);
          setSaveStatus(ok ? "saved" : "error");
          if (ok) setTimeout(() => setSaveStatus("idle"), 2000);
          else setTimeout(() => setSaveStatus("idle"), 3000);
        } catch {
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 3000);
        }
      }, 800);
    },
    [saveAnswers]
  );

  const setAnswer = useCallback((key: keyof Answers, value: Answers[keyof Answers]) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const handleUpdateReport = useCallback(async () => {
    if (!guide || !jobId) return;
    const token = await getSession();
    if (!token) return;

    setReportUpdating(true);
    const snapshot = { total: progress.total, done: progress.done, percent: progress.pct, missing_top5: getMissingTop(modules, 5) };
    try {
      const res = await fetch("/api/job-guide/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jobGuideId: guide.id,
          jobPostId: jobId,
          answers_json: answers,
          checklist_snapshot: snapshot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız");

      setGuide((g) =>
        g
          ? {
              ...g,
              report_json: (data.report_json ?? g.report_json) as ReportJson | null,
              report_md: data.report_md ?? g.report_md,
              progress_step: data.progress_step ?? g.progress_step,
            }
          : null
      );
      setLastReportUpdate(new Date().toISOString());
      setToast("Rapor güncellendi");
      setTimeout(() => setToast(null), 3000);
      setReportViewOpen(true);
    } catch (e) {
      setToast("Güncelleme başarısız. Tekrar deneyin.");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setReportUpdating(false);
    }
  }, [guide, jobId, getSession, answers, progress, modules]);

  const handleSaveReport = useCallback(() => {
    if (!guide) return;
    setGuide((g) => (g ? { ...g, status: "completed" } : null));
    getSession().then((t) => {
      if (!t) return;
      fetch("/api/job-guide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ jobGuideId: guide.id, status: "completed" }),
      });
    });
    setToast("Kaydedildi");
    setTimeout(() => setToast(null), 3000);
  }, [guide, getSession]);

  if (jobLoadError) {
    return <JobNotFoundShell jobId={jobId} />;
  }
  if (loading || !job) {
    return <LoadingShell jobId={jobId} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl flex-wrap items-center justify-between gap-2 px-4">
          <Link href="/premium/job-guides" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Başvuru Paneli
          </Link>
          <div className="flex items-center gap-3">
            {reportUpdating && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                🟢 Canlı Analiz: Güncelleniyor…
              </span>
            )}
            {saveStatus === "saving" && <span className="text-xs text-slate-500">Kaydediliyor…</span>}
            {saveStatus === "saved" && <span className="text-xs text-emerald-600">✅ Kaydedildi</span>}
            {saveStatus === "error" && <span className="text-xs text-amber-600">⚠️ Bağlantı sorunu</span>}
            {lastReportUpdate && !reportUpdating && (
              <span className="text-xs text-slate-500">Son güncelleme: {formatRelativeTime(lastReportUpdate)}</span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5">
        {/* Hero kart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">📋</div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{progress.total} Madde Başvuru Kontrol Listesi</h1>
                <p className="text-sm text-slate-500">İlanlar Cebimde Premium</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Tamamlanma</p>
              <p className="text-lg font-bold text-slate-900">%{progress.pct}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress.pct}%`,
                  background: "linear-gradient(90deg, #2563eb 0%, #22c55e 100%)",
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {progress.done} / {progress.total} madde tamamlandı
            </p>
          </div>
          {missingTop3.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
              <p className="text-sm font-semibold text-amber-900">Bugün bitirmen gereken 3 şey</p>
              <ol className="mt-2 list-decimal list-inside space-y-0.5 text-sm text-amber-800">
                {missingTop3.map((label, i) => (
                  <li key={i}>{label}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Grid: modüller | checklist | asistan */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Sol: modül kartları */}
          <div className="space-y-3 lg:col-span-4">
            {modules.map((m) => {
              const doneCount = m.items.filter((i) => i.done).length;
              const status = doneCount === m.items.length ? "done" : doneCount > 0 ? "partial" : "todo";
              const locked = !baseUnlocked && !["passport", "cv"].includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    if (locked) return;
                    setSelectedModuleId(m.id);
                  }}
                  title={locked ? "Önce pasaport ve CV sorularını cevapla" : undefined}
                  className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                    locked ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-80" : ""
                  } ${
                    selectedModuleId === m.id ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                        {locked ? "🔒" : m.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{m.title}</p>
                        <p className="text-sm text-slate-500">{m.items.length} madde</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {locked ? (
                        <span className="text-slate-400" title="Önce pasaport ve CV">🔒</span>
                      ) : (
                        <>
                          <span className={status === "done" ? "text-green-600" : "text-slate-300"}>✔</span>
                          <span className={status !== "todo" ? "text-green-600" : "text-slate-300"}>✔</span>
                          <span className={status === "partial" ? "text-amber-500" : "text-slate-300"}>●</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Orta: seçili modül detayları */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedModule?.icon} {selectedModule?.title}
                </h2>
                <p className="text-sm text-slate-500">Bu bölümdeki maddeleri tamamla</p>
              </div>
              {job.source_url && (
                <a
                  href={job.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  İlana Git
                </a>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {selectedModule?.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{it.label}</p>
                    {it.hint && <p className="mt-1 text-xs text-slate-500">{it.hint}</p>}
                  </div>
                  <span className={it.done ? "text-green-600" : "text-slate-300"}>✔</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: asistan (6 soru + AI + Kaydet) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-3">
            <h2 className="text-lg font-bold text-slate-900">Asistan</h2>
            <p className="mt-1 text-sm text-slate-500">Kısa sorularla sana özel yol haritası</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">1. Pasaportun var mı?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setAnswer("passport", "var")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">Var</button>
                  <button type="button" onClick={() => setAnswer("passport", "basvurdum")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">Başvurdum</button>
                  <button type="button" onClick={() => setAnswer("passport", "yok")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">Yok</button>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">2. CV hazır mı?</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setAnswer("cv", "var")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">Var</button>
                  <button type="button" onClick={() => setAnswer("cv", "yok")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">Yok</button>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">3. Dil seviyen?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["hic", "a1", "a2", "b1", "b2"] as const).map((l) => (
                    <button key={l} type="button" onClick={() => setAnswer("language", l)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">{l.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">4. Deneyim yılı?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["0-1", "2-4", "5+"] as const).map((e) => (
                    <button key={e} type="button" onClick={() => setAnswer("experience", e)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">{e}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">5. Mesleğin?</p>
                <input
                  type="text"
                  placeholder="Örn: Kaynakçı, Elektrikçi"
                  value={answers.profession ?? ""}
                  onChange={(e) => {
                    const next = { ...answers, profession: e.target.value.trim() || undefined };
                    setAnswers(next);
                    scheduleSave(next);
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">6. Ülkeye gidiş engelin var mı?</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setAnswer("barrier", "yok")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">Yok</button>
                  <button type="button" onClick={() => setAnswer("barrier", "var")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">Var</button>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleUpdateReport}
                  disabled={reportUpdating}
                  className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {reportUpdating ? "Güncelleniyor…" : "AI Analiz Güncelle"}
                </button>
                <button type="button" onClick={handleSaveReport} className="w-full rounded-2xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800">
                  Kaydet
                </button>
              </div>
              {lastReportUpdate && (
                <p className="text-xs text-slate-500">Son güncelleme: {formatRelativeTime(lastReportUpdate)}</p>
              )}
            </div>
          </div>
        </div>

        {/* İlan kartı (alt) */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">İlan</p>
          <h3 className="text-lg font-bold text-slate-900">{job.title ?? "—"}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {job.location_text ?? "—"} · {job.source_name ?? "—"}
          </p>
          {(job as JobSummary & { snippet?: string }).snippet && (
            <p className="mt-3 text-sm text-slate-600">{(job as JobSummary & { snippet?: string }).snippet}</p>
          )}
        </div>

        {/* Rapor bölümü: sekmeli (Rehber / Belgeler / Vize / Maaş&Yaşam / Risk / Uygunluk / 30 Gün) */}
        {(guide?.report_json || reportViewOpen) && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setReportViewOpen((v) => !v)}
              className="mb-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {reportViewOpen ? "▼ Raporu gizle" : "▶ Raporu görüntüle"}
            </button>
            {reportViewOpen && (
              <ReportViewer
                report={guide?.report_json ?? null}
                loading={reportUpdating}
                onSave={handleSaveReport}
                onRefresh={handleUpdateReport}
                lastUpdated={lastReportUpdate ? formatRelativeTime(lastReportUpdate) : null}
              />
            )}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
