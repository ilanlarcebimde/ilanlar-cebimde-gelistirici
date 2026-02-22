"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type JobGuideRow = {
  id: string;
  job_post_id: string;
  status: string;
  progress_step: number;
  report_json: { sana_ozel?: string; top_actions?: string[] } | null;
  updated_at: string;
  job_posts: { id: string; title: string | null; location_text: string | null } | null;
};

function extractScore(report: JobGuideRow["report_json"]): number | null {
  if (!report?.sana_ozel) return null;
  const m = String(report.sana_ozel).match(/%\s*(\d+)|(\d+)\s*%/);
  return m ? parseInt(m[1] || m[2], 10) : null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export default function PremiumJobGuidesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<JobGuideRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("job_guides")
      .select("id, job_post_id, status, progress_step, report_json, updated_at, job_posts(id, title, location_text)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      setList([]);
      return;
    }
    setList((data as JobGuideRow[]) ?? []);
  }, [user?.id]);

  useEffect(() => {
    fetchList().finally(() => setLoading(false));
  }, [fetchList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-600">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <h1 className="text-xl font-bold text-slate-900">Premium Başvuru Paneli</h1>
          <p className="mt-1 text-sm text-slate-600">
            Devam edenler ve kaydedilen rehberleriniz.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {list.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-600">Henüz başvuru rehberi oluşturmadınız.</p>
            <p className="mt-1 text-sm text-slate-500">
              İlan kartlarındaki &quot;Nasıl Başvururum?&quot; butonuna tıklayarak başlayın.
            </p>
            <Link
              href="/ucretsiz-yurtdisi-is-ilanlari"
              className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              İlanlara Git
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((row) => {
              const post = row.job_posts;
              const title = post?.title ?? "İlan";
              const location = post?.location_text ?? "";
              const score = extractScore(row.report_json);
              const isCompleted = row.status === "completed";

              return (
                <li key={row.id}>
                  <Link
                    href={"/premium/job-guide/" + row.job_post_id}
                    className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-slate-900 truncate">{title}</h2>
                        <p className="mt-0.5 text-sm text-slate-500">{location}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {score != null && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            %{score}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isCompleted ? "Tamamlandı" : "Devam ediyor"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Son güncelleme: {formatDate(row.updated_at)}</p>
                    <span className="mt-3 inline-block text-sm font-medium text-brand-600">Devam Et →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
