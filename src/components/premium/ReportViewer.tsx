"use client";

import { useState } from "react";

export type ReportJson = {
  summary?: string;
  top_actions?: string[];
  rehber?: string;
  belgeler?: string;
  vize_izin?: string;
  maas_yasam?: string;
  risk?: string;
  sana_ozel?: string;
  plan_30_gun?: string;
};

const TABS = [
  { id: "rehber", label: "Rehber", key: "rehber" as keyof ReportJson },
  { id: "belgeler", label: "Belgeler", key: "belgeler" as keyof ReportJson },
  { id: "vize", label: "Vize/İzin", key: "vize_izin" as keyof ReportJson },
  { id: "maas", label: "Maaş/Yaşam", key: "maas_yasam" as keyof ReportJson },
  { id: "risk", label: "Risk", key: "risk" as keyof ReportJson },
  { id: "ozel", label: "Sana Özel", key: "sana_ozel" as keyof ReportJson },
  { id: "30gun", label: "30 Gün", key: "plan_30_gun" as keyof ReportJson },
];

function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(String).join("\n");
  return String(v);
}

export function ReportViewer({
  report,
  loading,
  onSave,
  onRefresh,
  lastUpdated,
}: {
  report: ReportJson | null;
  loading?: boolean;
  onSave?: () => void;
  onRefresh?: () => void;
  lastUpdated?: string | null;
}) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-100" />
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">Rapor güncelleniyor…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">🔒 Bu İlan İçin Başvuru Rehberi</h2>
        <p className="mt-4 text-sm text-slate-600">
          Soru-cevap asistanına cevap verip &quot;Raporu Güncelle&quot; butonuna tıklayarak kişiselleştirilmiş rehberi oluşturun.
        </p>
      </div>
    );
  }

  const summary = asText(report.summary);
  const topActions = Array.isArray(report.top_actions) ? report.top_actions : [];
  const activeTabDef = TABS.find((t) => t.id === activeTab);
  const activeContent = activeTabDef ? asText(report[activeTabDef.key]) : "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">🔒 Bu İlan İçin Başvuru Rehberi</h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-slate-500">Son güncelleme: {lastUpdated}</span>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              📌 Raporu Kaydet
            </button>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
            >
              🔄 Yenile
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex gap-1 p-2 min-w-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition min-h-[44px] ${
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

      <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
        {summary && (
          <>
            <h3 className="text-sm font-semibold text-slate-700">📌 Özet</h3>
            <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{summary}</p>
          </>
        )}
        {topActions.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-slate-700">🎯 Öncelikli 3 Aksiyon</h3>
            <ol className="mt-1 list-decimal list-inside text-sm text-slate-600 space-y-0.5">
              {topActions.slice(0, 3).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </>
        )}
        {activeContent && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700">{TABS.find((t) => t.id === activeTab)?.label}</h3>
            <div className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{activeContent}</div>
          </div>
        )}
        {!activeContent && !summary && topActions.length === 0 && (
          <p className="text-sm text-slate-500">Bu sekmede henüz içerik yok.</p>
        )}
      </div>
    </div>
  );
}
