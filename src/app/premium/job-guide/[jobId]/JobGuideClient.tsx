"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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

type ChatMessage = { role: "user" | "assistant"; text: string; ts?: string; next_questions?: NextQuestion[] };
type NextQuestion = { id: string; question: string; type: string; options?: string[] };
type UiHints = { progress_percent?: number; unlock?: string[]; missing_top3?: string[] };

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
          <Link href="/premium/job-guides" className="rounded-xl bg-slate-800 px-4 py-3 font-medium text-white hover:bg-slate-700">Başvuru Paneline Dön</Link>
          <Link href="/ucretsiz-yurtdisi-is-ilanlari" className="rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">İlanlara Git</Link>
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
          <Link href="/premium/job-guides" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Başvuru Paneli</Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-lg font-bold text-slate-900">Premium Başvuru Paneli</h1>
        <p className="mt-2 text-slate-600">İlan yükleniyor…</p>
      </main>
    </div>
  );
}

export function JobGuideClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobSummary | null>(null);
  const [guide, setGuide] = useState<JobGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobLoadError, setJobLoadError] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextQuestions, setNextQuestions] = useState<NextQuestion[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [report, setReport] = useState<ReportJson | null>(null);
  const [uiHints, setUiHints] = useState<UiHints>({});
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [initialChatFetched, setInitialChatFetched] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState<"closed" | "checklist" | "report">("closed");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [reportUpdating, setReportUpdating] = useState(false);
  const [lastReportUpdate, setLastReportUpdate] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesBottomRef = useRef<HTMLDivElement>(null);

  const getSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  useEffect(() => {
    setJob(null);
    setGuide(null);
    setLoading(true);
    setJobLoadError(false);
    setMessages([]);
    setNextQuestions([]);
    setAnswers({});
    setReport(null);
    setUiHints({});
    setInitialChatFetched(false);
    let cancelled = false;
    const trimmedId = String(jobId).trim();
    if (!trimmedId) {
      setJobLoadError(true);
      setLoading(false);
      return () => { cancelled = true; };
    }

    async function run() {
      const token = await getSession();
      if (!token || cancelled) return;

      let panelRes = await fetch(`/api/premium/panel/${trimmedId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (cancelled) return;
      if (panelRes.status === 404) {
        await new Promise((r) => setTimeout(r, 1000));
        if (cancelled) return;
        panelRes = await fetch(`/api/premium/panel/${trimmedId}`, { headers: { Authorization: `Bearer ${token}` } });
      }
      if (cancelled) return;

      if (panelRes.ok) {
        const data = (await panelRes.json()) as { job: JobSummary; guide: JobGuide; chat_messages?: Array<{ role: "user" | "assistant"; text: string; ts: string; next_questions?: NextQuestion[] }> };
        if (cancelled) return;
        setJob(data.job);
        if (data.guide) {
          setGuide(data.guide);
          setAnswers(answersFromJson((data.guide.answers_json as Record<string, unknown>) ?? {}));
          setReport((data.guide.report_json as ReportJson) ?? null);
        }
        const chat = data.chat_messages ?? [];
        if (chat.length > 0) {
          const msgs: ChatMessage[] = chat.map((m) => ({ role: m.role, text: m.text, ts: m.ts, next_questions: m.next_questions }));
          setMessages(msgs);
          const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
          if (lastAssistant?.next_questions?.length) setNextQuestions(lastAssistant.next_questions);
        }
        setLoading(false);
        return;
      }

      if (panelRes.status === 404 || panelRes.status === 500) {
        const fallbackJobRes = await fetch(`/api/job-posts/${trimmedId}`);
        if (cancelled) return;
        if (fallbackJobRes.ok) {
          const jobData = (await fallbackJobRes.json()) as JobSummary;
          const guideRes = await fetch(`/api/job-guide?jobPostId=${encodeURIComponent(trimmedId)}`, { headers: { Authorization: `Bearer ${token}` } });
          let guideData: JobGuide | null = null;
          if (guideRes.ok) guideData = (await guideRes.json()) as JobGuide;
          else {
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
            setReport((guideData.report_json as ReportJson) ?? null);
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
        const guideRes = await fetch(`/api/job-guide?jobPostId=${encodeURIComponent(trimmedId)}`, { headers: { Authorization: `Bearer ${token}` } });
        let guideData: JobGuide | null = null;
        if (guideRes.ok) guideData = (await guideRes.json()) as JobGuide;
        else {
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
          setReport((guideData.report_json as ReportJson) ?? null);
        }
        if (!cancelled) setLoading(false);
        return;
      }
      if (!cancelled) {
        setJobLoadError(true);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [jobId, getSession]);

  // İlk açılışta sohbet yoksa ilk asistan mesajını al
  useEffect(() => {
    if (loading || !guide || !job || initialChatFetched || messages.length > 0) return;
    let cancelled = false;
    (async () => {
      const token = await getSession();
      if (!token || cancelled) return;
      setInitialChatFetched(true);
      setSending(true);
      try {
        const res = await fetch("/api/job-guide/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            jobGuideId: guide.id,
            jobPostId: job.id,
            answers_json: guide.answers_json,
            chat_history: [],
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Chat başlatılamadı");
        const msg: ChatMessage = { role: "assistant", text: data.assistant_message ?? "", next_questions: data.next_questions };
        setMessages([msg]);
        setNextQuestions(Array.isArray(data.next_questions) ? data.next_questions : []);
        if (data.report_json) setReport(data.report_json);
        if (data.ui_hints && typeof data.ui_hints === "object") setUiHints(data.ui_hints);
        if (data.answers_json) setGuide((g) => (g ? { ...g, answers_json: data.answers_json } : null));
      } catch (e) {
        if (!cancelled) {
          setMessages([{ role: "assistant", text: "Bağlantı hatası. Lütfen tekrar deneyin." }]);
        }
      } finally {
        if (!cancelled) setSending(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loading, guide, job, initialChatFetched, messages.length, getSession]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !guide || !job || sending) return;
      const token = await getSession();
      if (!token) return;

      const userMsg: ChatMessage = { role: "user", text: trimmed, ts: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg]);
      setNextQuestions([]);
      setInputText("");
      setSending(true);

      const chatHistory = [...messages, userMsg].map((m) => ({ role: m.role, text: m.text }));

      try {
        const res = await fetch("/api/job-guide/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            jobGuideId: guide.id,
            jobPostId: job.id,
            user_message: trimmed,
            answers_json: guide.answers_json,
            chat_history: chatHistory.slice(0, -1),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gönderilemedi");

        const assistantMsg: ChatMessage = {
          role: "assistant",
          text: data.assistant_message ?? "",
          ts: new Date().toISOString(),
          next_questions: data.next_questions,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setNextQuestions(Array.isArray(data.next_questions) ? data.next_questions : []);
        if (data.report_json) setReport(data.report_json);
        if (data.ui_hints && typeof data.ui_hints === "object") setUiHints(data.ui_hints);
        if (data.answers_json) {
          setGuide((g) => (g ? { ...g, answers_json: data.answers_json } : null));
          setAnswers(answersFromJson(data.answers_json));
        }
      } catch (e) {
        setMessages((prev) => [...prev, { role: "assistant", text: "Bir hata oluştu. Lütfen tekrar deneyin." }]);
      } finally {
        setSending(false);
      }
    },
    [guide, job, messages, sending, getSession]
  );

  const handleQuickReply = useCallback(
    (option: string, questionId: string) => {
      sendMessage(option);
    },
    [sendMessage]
  );

  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const jobForChecklist = useMemo(
    () => (job ? { id: job.id, title: job.title, location_text: job.location_text, source_name: job.source_name, source_url: job.source_url, snippet: (job as { snippet?: string }).snippet } : null),
    [job]
  );
  const modules = useMemo(() => buildChecklist(jobForChecklist, answers), [jobForChecklist, answers]);
  const progressFromChecklist = useMemo(() => calcProgress(modules), [modules]);
  const missingTop3 = useMemo(() => getMissingTop(modules, 3), [modules]);
  const progressPercent = uiHints.progress_percent ?? progressFromChecklist.pct;
  const missingLabels = (Array.isArray(uiHints.missing_top3) ? uiHints.missing_top3 : missingTop3).slice(0, 3);

  const handleUpdateReport = useCallback(async () => {
    if (!guide || !jobId) return;
    const token = await getSession();
    if (!token) return;
    setReportUpdating(true);
    const snapshot = { total: progressFromChecklist.total, done: progressFromChecklist.done, percent: progressFromChecklist.pct, missing_top5: getMissingTop(modules, 5) };
    try {
      const res = await fetch("/api/job-guide/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobGuideId: guide.id, jobPostId: jobId, answers_json: answers, checklist_snapshot: snapshot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız");
      if (data.report_json) setReport(data.report_json);
      setLastReportUpdate(new Date().toISOString());
    } finally {
      setReportUpdating(false);
    }
  }, [guide, jobId, getSession, answers, progressFromChecklist, modules]);

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
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }, [guide, getSession]);

  if (jobLoadError) return <JobNotFoundShell jobId={jobId} />;
  if (loading || !job) return <LoadingShell jobId={jobId} />;

  const locationLabel = job.location_text ?? "";
  const sourceLabel = job.source_name ?? "";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header: ilan özeti + ilerleme */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur shrink-0">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href="/premium/job-guides" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Başvuru Paneli</Link>
            <div className="flex items-center gap-2">
              {saveStatus === "saving" && <span className="text-xs text-slate-500">Kaydediliyor…</span>}
              {saveStatus === "saved" && <span className="text-xs text-emerald-600">Kaydedildi</span>}
              <button
                type="button"
                onClick={() => setDrawerOpen((d) => (d === "checklist" ? "closed" : "checklist"))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Kontrol Listesi
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen((d) => (d === "report" ? "closed" : "report"))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Rapor
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="truncate text-base font-semibold text-slate-900 max-w-[280px] sm:max-w-none" title={job.title ?? ""}>{job.title ?? "—"}</span>
            {locationLabel && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{locationLabel}</span>}
            {sourceLabel && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{sourceLabel}</span>}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%`, background: "linear-gradient(90deg, #2563eb 0%, #22c55e 100%)" }}
              />
            </div>
            <span className="text-sm font-medium text-slate-700 shrink-0">%{progressPercent}</span>
          </div>
          {missingLabels.length > 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              Eksik adımlar: {missingLabels.join(" · ")}
            </p>
          )}
        </div>
      </header>

      {/* Ana alan: Sohbet */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto px-4 py-4">
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white min-h-[200px]">
          <div className="p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                  {m.role === "assistant" && i === messages.length - 1 && m.next_questions && m.next_questions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/50 flex flex-wrap gap-2">
                      {m.next_questions.map((q) =>
                        (q.options ?? []).map((opt) => (
                          <button
                            key={`${q.id}-${opt}`}
                            type="button"
                            onClick={() => handleQuickReply(opt, q.id)}
                            disabled={sending}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {opt}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-500">Yanıtlanıyor…</div>
              </div>
            )}
            <div ref={messagesBottomRef} />
          </div>
        </div>

        {/* Footer: input + gönder + quick reply chips (zaten mesaj içinde) */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Mesajınızı yazın..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputText);
              }
            }}
            disabled={sending}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => sendMessage(inputText)}
            disabled={sending || !inputText.trim()}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Gönder
          </button>
        </div>
      </main>

      {/* Drawer: Kontrol Listesi veya Rapor (mobil bottom sheet, desktop sağ panel) */}
      {drawerOpen !== "closed" && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setDrawerOpen("closed")} aria-hidden />
          <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto border-l border-slate-200 md:max-w-sm max-md:bottom-0 max-md:top-auto max-md:h-[70vh] max-md:rounded-t-xl max-md:border-t">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{drawerOpen === "checklist" ? "Kontrol Listesi" : "Rapor"}</h2>
              <button type="button" onClick={() => setDrawerOpen("closed")} className="text-slate-500 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <div className="p-4">
              {drawerOpen === "checklist" && (
                <ChecklistDrawerContent modules={modules} job={job} />
              )}
              {drawerOpen === "report" && (
                <ReportViewer
                  report={report}
                  loading={reportUpdating}
                  onSave={handleSaveReport}
                  onRefresh={handleUpdateReport}
                  lastUpdated={lastReportUpdate ? formatRelativeTime(lastReportUpdate) : null}
                />
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function ChecklistDrawerContent({ modules, job }: { modules: ChecklistModule[]; job: JobSummary }) {
  return (
    <div className="space-y-4">
      {job.source_url && (
        <a href={job.source_url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 text-center">
          İlana Git
        </a>
      )}
      {modules.map((m) => (
        <div key={m.id} className="rounded-xl border border-slate-200 p-3">
          <p className="font-bold text-slate-900 flex items-center gap-2">
            <span>{m.icon}</span> {m.title}
          </p>
          <ul className="mt-2 space-y-1.5">
            {m.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between text-sm">
                <span className={it.done ? "text-slate-500 line-through" : "text-slate-800"}>{it.label}</span>
                <span className={it.done ? "text-green-600" : "text-slate-300"}>✔</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
