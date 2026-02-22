"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { JobSummaryCard } from "@/components/premium/JobSummaryCard";
import { ProgressStepper } from "@/components/premium/ProgressStepper";
import { ReportViewer, type ReportJson } from "@/components/premium/ReportViewer";
import { AssistantChat, type ChatMessage } from "@/components/premium/AssistantChat";
import type { JobSummary } from "@/components/premium/JobSummaryCard";

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

const PLACEHOLDER_QUESTION = "Soru 1: Pasaportun var mı?";

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
          <p className="text-sm text-slate-500">{PLACEHOLDER_QUESTION}</p>
          <p className="mt-2 text-xs text-slate-400">Rapor ve soru-cevap alanı yükleniyor…</p>
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
  const [activeTab, setActiveTab] = useState<"report" | "chat">("report");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [nextQuestions, setNextQuestions] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [lastReportUpdate, setLastReportUpdate] = useState<string | null>(null);

  useEffect(() => {
    console.log("JOB GUIDE MOUNT", jobId);
  }, [jobId]);

  const getSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  useEffect(() => {
    setJob(null);
    setGuide(null);
    setLoading(true);
    setNextQuestions([]);
    setChatMessages([]);
    setActiveTab("report");

    let cancelled = false;

    async function run() {
      const token = await getSession();
      if (!token || cancelled) return;

      console.log("API job-posts GET", jobId);
      const [jobRes, guideRes] = await Promise.all([
        fetch(`/api/job-posts/${jobId}`),
        fetch(`/api/job-guide?jobPostId=${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      console.log("API job-posts result", jobId, jobRes.status);
      console.log("API job-guide GET result", jobId, guideRes.status);

      if (cancelled) return;
      if (!jobRes.ok) {
        console.warn("API job-posts 404 or error", jobId, jobRes.status);
        router.replace("/premium/job-guides");
        return;
      }
      const jobData = (await jobRes.json()) as JobSummary;
      if (!cancelled) setJob(jobData);

      if (guideRes.status === 404 || !guideRes.ok) {
        console.log("API job-guide POST (draft create)", jobId);
        const createRes = await fetch("/api/job-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ jobPostId: jobId }),
        });
        console.log("API job-guide POST result", jobId, createRes.status);
        if (!createRes.ok) {
          if (!cancelled) {
            const errBody = await createRes.text();
            console.error("API job-guide POST failed", jobId, createRes.status, errBody);
          }
          if (!cancelled) setLoading(false);
          return;
        }
        if (cancelled) return;
        const created = (await createRes.json()) as JobGuide;
        setGuide(created);
        if (created.report_json) {
          setNextQuestions((created.report_json as { next_questions?: string[] }).next_questions ?? []);
        }
      } else {
        const guideData = (await guideRes.json()) as JobGuide;
        if (!cancelled) {
          setGuide(guideData);
          if (guideData.report_json) {
            const r = guideData.report_json as { next_questions?: string[] };
            setNextQuestions(r.next_questions ?? []);
          }
        }
      }
      if (!cancelled) setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [jobId, getSession, router]);

  const handleSendAnswer = useCallback(
    async (text: string) => {
      if (!guide || !(await getSession())) return;
      setChatMessages((prev) => [...prev, { role: "user", text }]);
      setChatMessages((prev) => [...prev, { role: "system", text: "Cevabınız kaydedildi. Raporu güncellemek için aşağıdaki butona tıklayın." }]);

      const answers = { ...guide.answers_json, [`q_${Date.now()}`]: text };
      const token = await getSession();
      await fetch("/api/job-guide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobGuideId: guide.id, answers_json: answers }),
      });
      setGuide((g) => (g ? { ...g, answers_json: answers } : null));
      await supabase.from("job_guide_events").insert({ job_guide_id: guide.id, type: "answer", content: text });
    },
    [guide, getSession]
  );

  const handleUpdateReport = useCallback(async () => {
    if (!guide || !jobId) return;
    const token = await getSession();
    if (!token) return;

    setReportUpdating(true);
    console.log("API job-guide/update POST", { jobGuideId: guide.id, jobPostId: jobId });
    try {
      const res = await fetch("/api/job-guide/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jobGuideId: guide.id,
          jobPostId: jobId,
          answers_json: guide.answers_json,
        }),
      });
      const data = await res.json();
      console.log("API job-guide/update result", res.status, data?.error ?? "ok");
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız");

      setGuide((g) =>
        g
          ? {
              ...g,
              report_json: data.report_json ?? g.report_json,
              report_md: data.report_md ?? g.report_md,
              progress_step: data.progress_step ?? g.progress_step,
            }
          : null
      );
      setNextQuestions(data.next_questions ?? []);
      setLastReportUpdate(new Date().toISOString());
      setToast("Rapor güncellendi");
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast("Güncelleme başarısız. Tekrar deneyin.");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setReportUpdating(false);
    }
  }, [guide, jobId, getSession]);

  const handleSaveReport = useCallback(() => {
    if (!guide) return;
    setGuide((g) => (g ? { ...g, status: "completed" } : null));
    const token = getSession();
    token.then((t) => {
      if (!t) return;
      fetch("/api/job-guide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ jobGuideId: guide.id, status: "completed" }),
      });
    });
    setToast("Kaydedildi ✅");
    setTimeout(() => setToast(null), 3000);
  }, [guide, getSession]);

  // Minimum shell: panel açıldığını belli et; ilan yüklenirken checklist + soru placeholder
  if (loading || !job) {
    return <LoadingShell jobId={jobId} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/premium/job-guides" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Başvuru Paneli
          </Link>
          <span className="text-xs text-slate-500">
            {lastReportUpdate ? `Son güncelleme: ${formatRelativeTime(lastReportUpdate)}` : ""}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-3 space-y-4">
            <JobSummaryCard job={job} />
            {guide && <ProgressStepper currentStep={guide.progress_step} />}
          </div>
          <div className="lg:col-span-5">
            <ReportViewer
              report={guide?.report_json ?? null}
              loading={reportUpdating}
              onSave={handleSaveReport}
              onRefresh={handleUpdateReport}
              lastUpdated={lastReportUpdate ? formatRelativeTime(lastReportUpdate) : null}
            />
          </div>
          <div className="lg:col-span-4">
            <AssistantChat
              messages={chatMessages}
              nextQuestions={nextQuestions}
              onSendAnswer={handleSendAnswer}
              onUpdateReport={handleUpdateReport}
              updating={reportUpdating}
            />
          </div>
        </div>

        <div className="lg:hidden space-y-4">
          <JobSummaryCard job={job} />
          {guide && <ProgressStepper currentStep={guide.progress_step} />}

          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium min-h-[44px] ${
                activeTab === "report" ? "bg-brand-600 text-white" : "text-slate-600"
              }`}
            >
              Rapor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium min-h-[44px] ${
                activeTab === "chat" ? "bg-brand-600 text-white" : "text-slate-600"
              }`}
            >
              Soru-Cevap
            </button>
          </div>

          {activeTab === "report" && (
            <ReportViewer
              report={guide?.report_json ?? null}
              loading={reportUpdating}
              onSave={handleSaveReport}
              onRefresh={handleUpdateReport}
              lastUpdated={lastReportUpdate ? formatRelativeTime(lastReportUpdate) : null}
            />
          )}
          {activeTab === "chat" && (
            <AssistantChat
              messages={chatMessages}
              nextQuestions={nextQuestions}
              onSendAnswer={handleSendAnswer}
              onUpdateReport={handleUpdateReport}
              updating={reportUpdating}
            />
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
