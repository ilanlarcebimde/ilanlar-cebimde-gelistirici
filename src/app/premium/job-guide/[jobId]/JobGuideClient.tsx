"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ReportViewer, type ReportJson } from "@/components/premium/ReportViewer";
import type { JobSummary } from "@/components/premium/JobSummaryCard";
import { answersFromJson, type Answers } from "./checklistRules";

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

type NextQuestionSingle = {
  id?: string;
  text: string;
  choices?: string[];
  input?: { type: "text"; placeholder: string } | { type: "textarea"; placeholder: string } | { type: "multiselect" };
};
type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  ts?: string;
  next_question?: NextQuestionSingle;
  next_questions?: Array<{ id: string; question: string; options?: string[] }>;
};

const CV_PACKAGE_URL = "https://www.ilanlarcebimde.com/yurtdisi-cv-paketi";

function renderMessageWithCvButton(text: string) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.trim() === CV_PACKAGE_URL) {
          return (
            <Fragment key={i}>
              <a
                href={CV_PACKAGE_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                CV Paketi&apos;ne Git
              </a>
              {i < lines.length - 1 ? "\n" : null}
            </Fragment>
          );
        }
        return <Fragment key={i}>{line}{i < lines.length - 1 ? "\n" : null}</Fragment>;
      })}
    </>
  );
}

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

function AuthRequiredShell({ jobId }: { jobId: string }) {
  const loginHref = `/giris?next=${encodeURIComponent(`/premium/job-guide/${jobId}`)}`;
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <p className="text-slate-800 font-medium mb-2">Giriş yapmanız gerekiyor</p>
        <p className="text-sm text-slate-600 mb-6">
          Bu sayfayı kullanmak için lütfen giriş yapın. Oturumunuz sonlanmış olabilir.
        </p>
        <div className="flex flex-col gap-3">
          <Link href={loginHref} className="rounded-xl bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700">Giriş Yap</Link>
          <Link href="/premium/job-guides" className="rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">Başvuru Paneline Dön</Link>
        </div>
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Link href="/premium/job-guides" className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">← Başvuru Paneli</Link>
      <p className="text-slate-600">İlan yükleniyor…</p>
    </div>
  );
}

type MobileTab = "sohbet" | "report";

export function JobGuideClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobSummary | null>(null);
  const [guide, setGuide] = useState<JobGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobLoadError, setJobLoadError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextQuestion, setNextQuestion] = useState<NextQuestionSingle | null>(null);
  const [lastAskId, setLastAskId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [report, setReport] = useState<ReportJson | null>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);
  const [reportUpdating, setReportUpdating] = useState(false);
  const [reportUpdateError, setReportUpdateError] = useState<string | null>(null);
  const [lastReportUpdate, setLastReportUpdate] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("sohbet");
  const [quickGuideText, setQuickGuideText] = useState<string | null>(null);
  const [quickGuideCollapsed, setQuickGuideCollapsed] = useState(false);
  const [inlineTextareaValue, setInlineTextareaValue] = useState("");
  const [inlineMultiSelected, setInlineMultiSelected] = useState<string[]>([]);
  const messagesBottomRef = useRef<HTMLDivElement>(null);
  const bootstrapInFlightRef = useRef(false);
  const chatFallback12sRef = useRef(false);

  const getSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  useEffect(() => {
    setJob(null);
    setGuide(null);
    setLoading(true);
    setJobLoadError(false);
    setAuthError(false);
    setMessages([]);
    setNextQuestion(null);
    setLastAskId(null);
    setAnswers({});
    setReport(null);
    let cancelled = false;
    const trimmedId = String(jobId).trim();
    if (!trimmedId) {
      setJobLoadError(true);
      setLoading(false);
      return () => { cancelled = true; };
    }

    async function run() {
      let token = await getSession();
      if (cancelled) return;
      if (!token) {
        await new Promise((r) => setTimeout(r, 800));
        if (cancelled) return;
        token = await getSession();
      }
      if (cancelled) return;
      if (!token) {
        if (!cancelled) {
          setAuthError(true);
          setLoading(false);
        }
        return;
      }

      let panelRes = await fetch(`/api/premium/panel/${trimmedId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (cancelled) return;
      if (panelRes.status === 404) {
        await new Promise((r) => setTimeout(r, 1000));
        if (cancelled) return;
        panelRes = await fetch(`/api/premium/panel/${trimmedId}`, { headers: { Authorization: `Bearer ${token}` } });
      }
      if (cancelled) return;

      if (panelRes.status === 401) {
        if (!cancelled) {
          setAuthError(true);
          setLoading(false);
        }
        return;
      }

      if (panelRes.ok) {
        const data = (await panelRes.json()) as {
          job: JobSummary;
          guide: JobGuide;
          chat_messages?: Array<{
            role: "user" | "assistant";
            text: string;
            ts: string;
            next_question?: NextQuestionSingle;
            next_questions?: unknown;
          }>;
        };
        if (cancelled) return;
        setJob(data.job);
        if (data.guide) {
          setGuide(data.guide);
          setAnswers(answersFromJson((data.guide.answers_json as Record<string, unknown>) ?? {}));
          setReport((data.guide.report_json as ReportJson) ?? null);
        }
        const chat = data.chat_messages ?? [];
        if (chat.length > 0) {
          const msgs: ChatMessage[] = chat.map((m) => ({
            role: m.role,
            text: m.text,
            ts: m.ts,
            next_question: m.next_question,
            next_questions: Array.isArray(m.next_questions) ? m.next_questions : undefined,
          }));
          setMessages(msgs);
          const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
          if (lastAssistant?.next_question) setNextQuestion(lastAssistant.next_question);
          else if (lastAssistant?.next_questions?.[0]) {
            const q = lastAssistant.next_questions[0];
            setNextQuestion({ text: q.question, choices: q.options });
          }
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
    run().catch((err) => {
      if (!cancelled) {
        console.error("[JobGuideClient] load error", err);
        setJobLoadError(true);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [jobId, getSession]);

  // Bootstrap: guide + job hazır, mesaj yoksa rehberi çek. Ref ile çift istek engellenir; abort/retry sonrası tekrar dener.
  useEffect(() => {
    if (loading || !guide || !job || messages.length > 0 || bootstrapInFlightRef.current) return;
    let cancelled = false;
    bootstrapInFlightRef.current = true;
    setSending(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const safetyId = setTimeout(() => {
      if (!cancelled) {
        setSending(false);
        setReportUpdating(false);
        setMessages((prev) => (prev.length === 0 ? [{ role: "assistant" as const, text: "Bağlantı gecikiyor. Aşağıdan yazıp gönderin veya sayfayı yenileyin." }] : prev));
        setNextQuestion((q) => q ?? { text: "Devam etmek için bir seçenek yazın veya tıklayın.", choices: ["Var", "Yok", "Emin değilim"] });
      }
      bootstrapInFlightRef.current = false;
    }, 10000);
    (async () => {
      const token = await getSession();
      if (!token || cancelled) {
        if (!cancelled) setSending(false);
        bootstrapInFlightRef.current = false;
        return;
      }
      try {
        const res = await fetch("/api/job-guide/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            jobGuideId: guide.id,
            jobPostId: job.id,
            mode: "bootstrap",
            answers_json: guide.answers_json,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          const errMsg = (data as { error?: string })?.error === "Unauthorized"
            ? "Oturum süren dolmuş olabilir. Lütfen tekrar giriş yap."
            : (data as { detail?: string; error?: string })?.detail ?? (data as { error?: string })?.error ?? "Chat başlatılamadı";
          setMessages([{ role: "assistant", text: `⚠️ ${errMsg}` }]);
          setNextQuestion({ text: "Pasaportun var mı?", choices: ["Var", "Başvurdum", "Yok"] });
          return;
        }
        // Yeni şema (assistant/state_patch) veya eski alanlar
        const d = data as {
          assistant?: { message_md?: string; quick_replies?: string[]; ask?: { id?: string; question?: string; type?: string; choices?: string[]; input?: { type: "textarea"; placeholder: string } } };
          state_patch?: { progress?: { total?: number; done?: number; percent?: number }; answers_patch?: Record<string, unknown> };
          assistant_message?: string;
          next_question?: NextQuestionSingle;
          quick_guide_text?: string;
          report_json?: ReportJson;
          checklist_snapshot?: { total: number; done: number; percent: number; missing_top3?: string[] };
          answers_json?: Record<string, unknown>;
        };
        const text = (d.assistant?.message_md ?? d.assistant_message ?? "").trim() || "Başvuru rehberini hazırlıyorum. Devam edelim.";
        if (d.quick_guide_text) setQuickGuideText(d.quick_guide_text);
        const ask = d.assistant?.ask;
        const nextQ: NextQuestionSingle | null = ask
          ? { id: ask.id, text: ask.question ?? "", choices: ask.choices, input: ask.input }
          : (d.next_question ?? null);
        if (ask?.id) setLastAskId(ask.id);
        const msg: ChatMessage = {
          role: "assistant",
          text,
          next_question: nextQ ?? undefined,
        };
        setMessages([msg]);
        setNextQuestion(nextQ ?? null);
        setInlineTextareaValue("");
        setInlineMultiSelected([]);
        if (d.report_json) setReport(d.report_json);
        if (d.answers_json) {
          setGuide((g) => (g ? { ...g, answers_json: d.answers_json! } : null));
          setAnswers(answersFromJson(d.answers_json));
        }
      } catch (e) {
        if (!cancelled) {
          const isAbort = e instanceof Error && e.name === "AbortError";
          setMessages([{ role: "assistant", text: isAbort ? "Yanıt gecikiyor. Sayfayı yenileyip tekrar deneyin veya aşağıdan bir seçenek yazın." : "Bağlantı hatası. Sayfayı yenileyip tekrar deneyin." }]);
          setNextQuestion({ text: "Pasaportun var mı?", choices: ["Var", "Başvurdum", "Yok"] });
        }
      } finally {
        clearTimeout(timeoutId);
        clearTimeout(safetyId);
        bootstrapInFlightRef.current = false;
        if (!cancelled) {
          setSending(false);
          setReportUpdating(false);
        }
      }
    })();
    return () => { cancelled = true; controller.abort(); clearTimeout(timeoutId); clearTimeout(safetyId); bootstrapInFlightRef.current = false; };
  }, [loading, guide, job, messages.length, getSession]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !guide || !job || sending) return;
      const token = await getSession();
      if (!token) {
        setMessages((prev) => [...prev, { role: "assistant", text: "⚠️ Giriş bilgisi alınamadı. Sayfayı yenileyip tekrar deneyin." }]);
        return;
      }

      const userMsg: ChatMessage = { role: "user", text: trimmed, ts: new Date().toISOString() };
      const prevNextQ = nextQuestion;
      setMessages((prev) => [...prev, userMsg]);
      setNextQuestion(null);
      setInputText("");
      setSending(true);
      chatFallback12sRef.current = false;

      const controller = new AbortController();
      const timeoutAbort = 25000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutAbort);
      const fallback12sId = setTimeout(() => {
        if (chatFallback12sRef.current) return;
        chatFallback12sRef.current = true;
        setMessages((prev) => [...prev, { role: "assistant", text: "Yanıt gecikti. Tekrar deneyelim." }]);
        setNextQuestion(prevNextQ ?? { text: "Tekrar dene", choices: ["Var", "Yok", "Emin değilim"] });
        setSending(false);
        setReportUpdating(false);
        controller.abort();
      }, 12000);
      const safetyId = setTimeout(() => {
        if (!chatFallback12sRef.current) setSending(false);
      }, 30000);
      try {
        if (typeof window !== "undefined") console.log("CHAT_SEND", { jobGuideId: guide.id, jobPostId: job.id });
        const res = await fetch("/api/job-guide/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            jobGuideId: guide.id,
            jobPostId: job.id,
            mode: "chat",
            message_text: trimmed,
            last_ask_id: lastAskId ?? undefined,
            answers_json: guide.answers_json,
            chat_history: messages.map((m) => ({ role: m.role, text: m.text })),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        clearTimeout(fallback12sId);
        clearTimeout(safetyId);
        if (chatFallback12sRef.current) return;
        if (typeof window !== "undefined") console.log("CHAT_RES", res.status);
        const data = await res.json().catch(() => ({}));
        if (typeof window !== "undefined") console.log("CHAT_DATA_KEYS", Object.keys(data ?? {}));

        if (!res.ok) {
          const errMsg =
            (data as { error?: string })?.error === "Unauthorized"
              ? "Oturum süren dolmuş olabilir. Lütfen tekrar giriş yap."
              : (data as { error?: string })?.error === "gemini_not_configured"
                ? "AI yapılandırılmamış (GEMINI_API_KEY eksik)."
                : (data as { detail?: string; error?: string })?.detail ?? (data as { error?: string })?.error ?? "Bir hata oluştu. Tekrar deneyin.";
          setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ ${errMsg}` }]);
          setNextQuestion({ text: "Pasaportun var mı?", choices: ["Var", "Başvurdum", "Yok"] });
          return;
        }

        const d = data as {
          assistant?: { message_md?: string; quick_replies?: string[]; ask?: { id?: string; question?: string; type?: string; choices?: string[]; input?: { type: "textarea"; placeholder: string } } };
          state_patch?: { progress?: { total?: number; done?: number; percent?: number }; answers_patch?: Record<string, unknown> };
          assistant_message?: string;
          next_question?: NextQuestionSingle;
          next?: { should_finalize?: boolean; reason?: string };
          quick_guide_text?: string;
          report_json?: ReportJson;
          report_md?: string | null;
          checklist_snapshot?: { total: number; done: number; percent: number; missing_top3?: string[] };
          answers_json?: Record<string, unknown>;
        };
        const text = d.assistant?.message_md ?? d.assistant_message ?? "";
        if (d.quick_guide_text) setQuickGuideText(d.quick_guide_text);
        const ask = d.assistant?.ask;
        const nextQ: NextQuestionSingle | null = ask
          ? { id: ask.id, text: ask.question ?? "", choices: ask.choices, input: ask.input }
          : (d.next_question ?? null);
        const assistantMsg: ChatMessage = {
          role: "assistant",
          text: text || "Tamam. Devam edelim.",
          ts: new Date().toISOString(),
          next_question: nextQ ?? undefined,
        };
        if (ask?.id) setLastAskId(ask.id);
        setMessages((prev) => [...prev, assistantMsg]);
        setNextQuestion(nextQ);
        setInlineTextareaValue("");
        setInlineMultiSelected([]);
        if (d.report_json) setReport(d.report_json);
        if (d.next?.should_finalize) setReportDrawerOpen(true);
        if (d.answers_json) {
          setGuide((g) => (g ? { ...g, answers_json: d.answers_json! } : null));
          setAnswers(answersFromJson(d.answers_json));
        }
      } catch (e) {
        clearTimeout(timeoutId);
        clearTimeout(fallback12sId);
        clearTimeout(safetyId);
        if (!chatFallback12sRef.current) {
          if (typeof window !== "undefined") console.error("CHAT_ERR", e);
          const msg =
            e instanceof Error && e.message === "NO_TOKEN"
              ? "Giriş bilgisi alınamadı. Sayfayı yenileyip tekrar deneyin."
              : e instanceof Error && e.name === "AbortError"
                ? "Yanıt gecikiyor. Sayfayı yenileyin veya tekrar yazın."
                : "Bağlantı sorunu oldu. Tekrar dener misin?";
          setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ ${msg}` }]);
          setNextQuestion(prevNextQ ?? { text: "Pasaportun var mı?", choices: ["Var", "Başvurdum", "Yok"] });
        }
      } finally {
        clearTimeout(fallback12sId);
        clearTimeout(safetyId);
        setSending(false);
        setReportUpdating(false);
      }
    },
    [guide, job, messages, sending, lastAskId, nextQuestion, getSession]
  );

  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpdateReport = useCallback(async () => {
    if (!guide || !jobId) return;
    const token = await getSession();
    if (!token) return;
    setReportUpdateError(null);
    setReportUpdating(true);
    try {
      const res = await fetch("/api/job-guide/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jobGuideId: guide.id,
          jobPostId: jobId,
          answers_json: answers,
          checklist_snapshot: { total: 0, done: 0, percent: 0, missing_top5: [] },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data as { error?: string; detail?: string }).detail ?? (data as { error?: string }).error ?? "Güncelleme başarısız";
        if (res.status === 500) console.error("[JobGuide] report update 500", data);
        setReportUpdateError(msg);
        return;
      }
      if (data.report_json) setReport(data.report_json);
      setLastReportUpdate(new Date().toISOString());
    } finally {
      setReportUpdating(false);
    }
  }, [guide, jobId, getSession, answers]);

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
  }, [guide, getSession]);

  if (authError) return <AuthRequiredShell jobId={jobId} />;
  if (jobLoadError) return <JobNotFoundShell jobId={jobId} />;
  if (loading || !job || !guide) return <LoadingShell />;

  const locationLabel = job.location_text ?? "";
  const sourceLabel = job.source_name ?? "";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Üst: İlan özeti */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/premium/job-guides" className="text-sm font-medium text-slate-600 hover:text-slate-900 shrink-0">← Başvuru Paneli</Link>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="truncate text-base font-semibold text-slate-900 max-w-[200px] sm:max-w-md" title={job.title ?? ""}>{job.title ?? "—"}</span>
            {sourceLabel && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{sourceLabel}</span>}
            {locationLabel && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{locationLabel}</span>}
            {job.source_url && (
              <a href={job.source_url} target="_blank" rel="noreferrer" className="hidden sm:inline-flex rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700">
                İlana Git
              </a>
            )}
            <button
              type="button"
              onClick={() => setReportDrawerOpen(true)}
              className="hidden md:inline-flex rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Yapılacaklar
            </button>
          </div>
          {sourceLabel && (
            <p className="mt-2 text-xs text-slate-600">{sourceLabel} üzerinden. İlana Git ile sayfayı açıp gerekirse Türkçeye çevirin.</p>
          )}
        </div>

        {/* Mobil: Tab bar */}
        <div className="md:hidden flex border-t border-slate-200">
          <button
            type="button"
            onClick={() => setMobileTab("sohbet")}
            className={`flex-1 py-3 text-sm font-medium ${mobileTab === "sohbet" ? "text-sky-600 border-b-2 border-sky-600 bg-sky-50/50" : "text-slate-600"}`}
          >
            Sohbet
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("report")}
            className={`flex-1 py-3 text-sm font-medium ${mobileTab === "report" ? "text-sky-600 border-b-2 border-sky-600 bg-sky-50/50" : "text-slate-600"}`}
          >
            Yapılacaklar
          </button>
        </div>
      </header>

      {/* Desktop: sohbet ortada (max genişlik) | Mobil: tab (sohbet / yapılacaklar) */}
      <div className="flex-1 flex min-h-0 overflow-hidden md:justify-center md:bg-slate-100/50">
        {/* Sohbet — masaüstünde ortalanmış, tüm ekranı kaplamaz. */}
        <section className="w-full max-w-2xl min-h-0 hidden md:flex md:flex-col md:overflow-hidden border-x border-slate-200 bg-slate-50/50 shadow-sm">
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Hızlı Rehber (sabit, kapanabilir) — tek sefer görünür */}
              {quickGuideText && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuickGuideCollapsed((c) => !c)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100"
                  >
                    <span>Hızlı Rehber</span>
                    <span className="text-slate-500 text-sm font-normal">{quickGuideCollapsed ? "Göster" : "Gizle"}</span>
                  </button>
                  {!quickGuideCollapsed && (
                    <div className="px-4 pb-4 pt-0 text-sm text-slate-700 whitespace-pre-wrap border-t border-slate-100">{quickGuideText}</div>
                  )}
                </div>
              )}
              {(messages.length ? messages : [{ role: "assistant" as const, text: "Rehber yükleniyor…" }]).map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-sky-600 text-white" : "bg-white border border-slate-200 text-slate-900 shadow-sm"}`}>
                      {m.role === "assistant" ? (
                        <div className="text-sm whitespace-pre-wrap">{renderMessageWithCvButton(m.text)}</div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{m.text === "__continue__" ? "Devam" : m.text}</p>
                      )}
                      {m.role === "assistant" && i === (messages.length || 1) - 1 && (
                      (m.next_question || (m.next_questions && m.next_questions.length > 0))
                        ? (
                      <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                        {m.next_question?.input?.type === "multiselect" ? (
                          <>
                            <div className="w-full flex flex-wrap gap-2">
                              {(m.next_question.choices ?? []).map((opt) => {
                                const active = inlineMultiSelected.includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      setInlineMultiSelected((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]);
                                    }}
                                    disabled={sending}
                                    className={active
                                      ? "rounded-xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm text-sky-700 disabled:opacity-50"
                                      : "rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (inlineMultiSelected.length > 0) {
                                  sendMessage(inlineMultiSelected.join(", "));
                                  setInlineMultiSelected([]);
                                }
                              }}
                              disabled={sending || inlineMultiSelected.length === 0}
                              className="rounded-xl bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                              Devam
                            </button>
                          </>
                        ) : m.next_question?.input?.type === "text" ? (
                          <>
                            <input
                              value={inlineTextareaValue}
                              onChange={(e) => setInlineTextareaValue(e.target.value)}
                              placeholder={m.next_question.input.placeholder}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                              aria-label="Yanıt"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const v = inlineTextareaValue.trim();
                                if (v) { sendMessage(v); setInlineTextareaValue(""); }
                              }}
                              disabled={sending || !inlineTextareaValue.trim()}
                              className="rounded-xl bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                              Gönder
                            </button>
                          </>
                        ) : m.next_question?.id === "blocking_issue_text" ? (
                          <>
                            <textarea
                              value={inlineTextareaValue}
                              onChange={(e) => setInlineTextareaValue(e.target.value)}
                              placeholder={m.next_question.input?.placeholder ?? "Sorunu yazın…"}
                              rows={3}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                              aria-label="Yanıt"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const v = inlineTextareaValue.trim();
                                if (v) { sendMessage(v); setInlineTextareaValue(""); }
                              }}
                              disabled={sending || !inlineTextareaValue.trim()}
                              className="rounded-xl bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                              Gönder
                            </button>
                          </>
                        ) : (
                          (m.next_question?.choices ?? m.next_questions?.[0]?.options ?? []).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => sendMessage(opt)}
                              disabled={sending}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {opt}
                            </button>
                          ))
                        )}
                      </div>
                        )
                        : messages.length === 1 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => sendMessage("__continue__")}
                          disabled={sending}
                          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          Devam
                        </button>
                      </div>
                        )
                    )}
                  </div>
                </div>
              ))}
              {sending && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                <div className="flex justify-start pointer-events-none" aria-live="polite" aria-busy="true">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-400 italic">Cevaplanıyor…</div>
                </div>
              )}
              <div ref={messagesBottomRef} />
            </div>
          </div>
          <div className="shrink-0 p-4 border-t border-slate-200 bg-white">
            <form
              className="max-w-2xl mx-auto flex gap-2"
              onSubmit={(e) => { e.preventDefault(); sendMessage(inputText); }}
            >
              <input
                type="text"
                placeholder="Mesajınızı yazın..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label="Mesaj"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Gönder
              </button>
            </form>
          </div>
        </section>

        {/* Mobil: Sohbet tab içeriği */}
        {mobileTab === "sohbet" && (
            <div className="md:hidden flex-1 flex flex-col min-h-0 bg-slate-50/50">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {/* Hızlı Rehber (sabit, kapanabilir) */}
                {quickGuideText && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuickGuideCollapsed((c) => !c)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100"
                    >
                      <span>Hızlı Rehber</span>
                      <span className="text-slate-500 text-sm font-normal">{quickGuideCollapsed ? "Göster" : "Gizle"}</span>
                    </button>
                    {!quickGuideCollapsed && (
                      <div className="px-4 pb-4 pt-0 text-sm text-slate-700 whitespace-pre-wrap border-t border-slate-100">{quickGuideText}</div>
                    )}
                  </div>
                )}
                {(messages.length ? messages : [{ role: "assistant" as const, text: "Rehber yükleniyor…" }]).map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-sky-600 text-white" : "bg-white border border-slate-200 text-slate-900 shadow-sm"}`}>
                      {m.role === "assistant" ? (
                        <div className="text-sm whitespace-pre-wrap">{renderMessageWithCvButton(m.text)}</div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{m.text === "__continue__" ? "Devam" : m.text}</p>
                      )}
                      {m.role === "assistant" && i === (messages.length || 1) - 1 && (
                        (m.next_question || (m.next_questions && m.next_questions.length > 0))
                          ? (
                        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-2">
                          {m.next_question?.input?.type === "multiselect" ? (
                            <>
                              <div className="w-full flex flex-wrap gap-2">
                                {(m.next_question.choices ?? []).map((opt) => {
                                  const active = inlineMultiSelected.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => {
                                        setInlineMultiSelected((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]);
                                      }}
                                      disabled={sending}
                                      className={active
                                        ? "rounded-xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm text-sky-700 disabled:opacity-50"
                                        : "rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (inlineMultiSelected.length > 0) {
                                    sendMessage(inlineMultiSelected.join(", "));
                                    setInlineMultiSelected([]);
                                  }
                                }}
                                disabled={sending || inlineMultiSelected.length === 0}
                                className="rounded-xl bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 self-end"
                              >
                                Devam
                              </button>
                            </>
                          ) : m.next_question?.input?.type === "text" ? (
                            <>
                              <input
                                value={inlineTextareaValue}
                                onChange={(e) => setInlineTextareaValue(e.target.value)}
                                placeholder={m.next_question.input.placeholder}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                aria-label="Yanıt"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const v = inlineTextareaValue.trim();
                                  if (v) { sendMessage(v); setInlineTextareaValue(""); }
                                }}
                                disabled={sending || !inlineTextareaValue.trim()}
                                className="rounded-xl bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 self-end"
                              >
                                Gönder
                              </button>
                            </>
                          ) : m.next_question?.id === "blocking_issue_text" ? (
                            <>
                              <textarea
                                value={inlineTextareaValue}
                                onChange={(e) => setInlineTextareaValue(e.target.value)}
                                placeholder={m.next_question.input?.placeholder ?? "Sorunu yazın…"}
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                                aria-label="Yanıt"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const v = inlineTextareaValue.trim();
                                  if (v) { sendMessage(v); setInlineTextareaValue(""); }
                                }}
                                disabled={sending || !inlineTextareaValue.trim()}
                                className="rounded-xl bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 self-end"
                              >
                                Gönder
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {(m.next_question?.choices ?? m.next_questions?.[0]?.options ?? []).map((opt) => (
                                <button key={opt} type="button" onClick={() => sendMessage(opt)} disabled={sending} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                          )
                          : messages.length === 1 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <button type="button" onClick={() => sendMessage("__continue__")} disabled={sending} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">Devam</button>
                        </div>
                          )
                      )}
                    </div>
                  </div>
                ))}
                {sending && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                  <div className="flex justify-start pointer-events-none" aria-live="polite" aria-busy="true">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-400 italic">Cevaplanıyor…</div>
                  </div>
                )}
                <div ref={messagesBottomRef} />
              </div>
              <form
                className="shrink-0 p-4 border-t border-slate-200 bg-white flex gap-2"
                onSubmit={(e) => { e.preventDefault(); sendMessage(inputText); }}
              >
                <input
                  type="text"
                  placeholder="Mesajınızı yazın..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputText); } }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label="Mesaj"
                />
                <button type="submit" disabled={sending || !inputText.trim()} className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
                  Gönder
                </button>
              </form>
            </div>
        )}

        {mobileTab === "report" && (
          <div className="md:hidden flex-1 overflow-y-auto bg-white p-4">
            {reportUpdateError && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p>{reportUpdateError}</p>
                <button type="button" onClick={handleUpdateReport} disabled={reportUpdating} className="mt-2 text-amber-700 font-medium underline disabled:opacity-50">Tekrar dene</button>
              </div>
            )}
            <ReportViewer
              report={report}
              loading={reportUpdating}
              onSave={handleSaveReport}
              onRefresh={handleUpdateReport}
              lastUpdated={lastReportUpdate ? formatRelativeTime(lastReportUpdate) : null}
            />
          </div>
        )}
      </div>

      {/* Yapılacaklar drawer (desktop) */}
      {reportDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setReportDrawerOpen(false)} aria-hidden />
          <aside className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 overflow-y-auto border-l border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Yapılacaklar</h2>
              <button type="button" onClick={() => setReportDrawerOpen(false)} className="text-slate-500 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <div className="p-4">
              {reportUpdateError && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p>{reportUpdateError}</p>
                  <button type="button" onClick={handleUpdateReport} disabled={reportUpdating} className="mt-2 text-amber-700 font-medium underline disabled:opacity-50">Tekrar dene</button>
                </div>
              )}
              <ReportViewer
                report={report}
                loading={reportUpdating}
                onSave={handleSaveReport}
                onRefresh={handleUpdateReport}
                lastUpdated={lastReportUpdate ? formatRelativeTime(lastReportUpdate) : null}
              />
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
