"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

/** Rehber sohbet kaldırıldı; ilan id’yi koruyup başvuru paneline yönlendir. */
export default function PremiumJobGuideRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = typeof params?.jobId === "string" ? params.jobId.trim() : "";

  useEffect(() => {
    const target = jobId ? `/premium/job-guides?jobId=${encodeURIComponent(jobId)}` : "/premium/job-guides";
    router.replace(target);
  }, [jobId, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <p className="text-slate-600">Yönlendiriliyorsunuz…</p>
    </div>
  );
}
