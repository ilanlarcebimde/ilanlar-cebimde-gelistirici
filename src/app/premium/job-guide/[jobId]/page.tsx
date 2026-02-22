"use client";

import { useEffect, useState } from "react";
import { JobGuideClient } from "./JobGuideClient";

function LoadingShell() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-lg font-bold text-slate-900">Premium Başvuru Paneli</h1>
        <p className="mt-2 text-slate-600">İlan yükleniyor…</p>
      </div>
    </div>
  );
}

export default function PremiumJobGuidePage({ params }: { params: Promise<{ jobId: string }> }) {
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.resolve(params).then((p) => setJobId(p.jobId ?? null));
  }, [params]);

  if (!jobId) {
    return <LoadingShell />;
  }

  return <JobGuideClient key={jobId} jobId={jobId} />;
}
