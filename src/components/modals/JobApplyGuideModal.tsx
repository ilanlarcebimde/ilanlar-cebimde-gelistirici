"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { isHiddenSourceName } from "@/lib/feedHiddenSources";

export type JobApplyGuidePost = {
  id: string;
  title: string | null;
  position_text: string | null;
  location_text: string | null;
  source_name: string | null;
  source_url: string | null;
  snippet: string | null;
  published_at: string | null;
  analysis_status?: string | null;
  analysis_json?: Record<string, unknown> | null;
};

type TabId = "guide" | "salary" | "personal";

const TABS: { id: TabId; label: string }[] = [
  { id: "guide", label: "Başvuru Rehberi" },
  { id: "salary", label: "Maaş & Risk" },
  { id: "personal", label: "Sana Özel Analiz" },
];

/** analysis_json içindeki metin bloklarını güvenli şekilde string yap */
function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(asText).join("\n");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Tek bölüm başlık + içerik */
function Section({ title, content }: { title: string; content: string }) {
  if (!content.trim()) return null;
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
      <div className="text-sm text-slate-600 whitespace-pre-wrap">{content}</div>
    </div>
  );
}

export function JobApplyGuideModal({
  open,
  onClose,
  jobId,
}: {
  open: boolean;
  onClose: () => void;
  jobId: string | null;
}) {
  const [job, setJob] = useState<JobApplyGuidePost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("guide");

  const fetchJob = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/job-posts/${id}`);
      if (!res.ok) {
        setError("İlan yüklenemedi.");
        setJob(null);
        return;
      }
      const data = (await res.json()) as JobApplyGuidePost;
      setJob(data);
    } catch {
      setError("İlan yüklenemedi.");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && jobId) fetchJob(jobId);
    if (!open) {
      setJob(null);
      setError(null);
      setActiveTab("guide");
    }
  }, [open, jobId, fetchJob]);

  if (!open) return null;

  const isReady = job?.analysis_status === "ready";
  const analysis = (job?.analysis_json ?? {}) as Record<string, Record<string, unknown>>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] sm:max-w-[700px] max-h-[90vh] rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden"
      >
        {/* Header: kapat + başlık bilgisi */}
        <div className="shrink-0 flex justify-between items-start gap-3 p-5 sm:p-6 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {loading ? "Yükleniyor…" : job?.title ?? "İlan"}
            </h2>
            {job && (
              <p className="mt-1 text-sm text-slate-500">
                {[job.location_text, job.source_name && !isHiddenSourceName(job.source_name) ? job.source_name : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 text-slate-500 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs: yatay scroll mobilde */}
        <div className="shrink-0 border-b border-slate-200 overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition min-h-[44px] ${
                  activeTab === tab.id
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* İçerik: scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {loading && !job && (
            <p className="text-sm text-slate-500">Yükleniyor…</p>
          )}
          {job && !loading && !isReady && (
            <p className="text-sm text-slate-600">Rehber hazırlanıyor.</p>
          )}
          {job && !loading && isReady && (
            <div className="text-[14px]">
              {activeTab === "guide" && (
                <>
                  <Section
                    title="Bu İşe Nasıl Başvurulur?"
                    content={asText(analysis?.guide?.howToApply ?? analysis?.howToApply)}
                  />
                  <Section
                    title="Gerekli Belgeler"
                    content={asText(analysis?.guide?.documents ?? analysis?.documents)}
                  />
                  <Section
                    title="Çalışma İzni ve Vize Süreci"
                    content={asText(analysis?.guide?.visaWorkPermit ?? analysis?.visaWorkPermit)}
                  />
                </>
              )}
              {activeTab === "salary" && (
                <>
                  <Section
                    title="Maaş ve Yaşam Hesabı"
                    content={asText(analysis?.salaryRisk?.salaryLiving ?? analysis?.salaryLiving)}
                  />
                  <Section
                    title="Risk Değerlendirmesi"
                    content={asText(analysis?.salaryRisk?.riskAssessment ?? analysis?.riskAssessment)}
                  />
                </>
              )}
              {activeTab === "personal" && (
                <>
                  <Section
                    title="Uygunluk Skoru"
                    content={asText(analysis?.personal?.score ?? analysis?.score)}
                  />
                  <Section
                    title="Eksikler"
                    content={asText(analysis?.personal?.gaps ?? analysis?.gaps)}
                  />
                  <Section
                    title="3 Öneri"
                    content={asText(analysis?.personal?.suggestions ?? analysis?.suggestions)}
                  />
                  <Section
                    title="30 Günlük Yol Haritası"
                    content={asText(analysis?.personal?.roadmap ?? analysis?.roadmap)}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
