"use client";

import Link from "next/link";
import { isHiddenSourceName } from "@/lib/feedHiddenSources";
import { formatPublishedAt } from "@/lib/formatTime";

export type JobSummary = {
  id: string;
  title: string | null;
  position_text: string | null;
  location_text: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
};

export function JobSummaryCard({ job }: { job: JobSummary }) {
  const sourceLabel = job.source_name && !isHiddenSourceName(job.source_name) ? job.source_name : "Kaynak";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">İlan Özeti</h2>
      <h3 className="mt-2 text-base font-bold leading-snug text-slate-900">{job.title || "İlan"}</h3>
      <p className="mt-1 text-sm text-slate-600">
        {[job.location_text, sourceLabel].filter(Boolean).join(" · ")}
      </p>
      {job.published_at && (
        <p className="mt-0.5 text-xs text-slate-500">Yayın: {formatPublishedAt(job.published_at)}</p>
      )}
      {(job.source_url || job.id) && (
        <Link
          href={job.source_url?.startsWith("http") ? job.source_url : "/r/" + job.id}
          target={job.source_url?.startsWith("http") ? "_blank" : undefined}
          rel={job.source_url?.startsWith("http") ? "noopener noreferrer" : undefined}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          İlana Git
        </Link>
      )}
    </div>
  );
}
