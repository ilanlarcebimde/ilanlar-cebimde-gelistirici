"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";
import { PremiumIntroModal } from "@/components/modals/PremiumIntroModal";
import { JobGuidePanel } from "./JobGuidePanel";
import { JobGuideErrorBoundary } from "./JobGuideErrorBoundary";

function LoadingShell() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <p className="text-slate-600">Kontrol ediliyor…</p>
    </div>
  );
}

export default function PremiumJobGuidePage() {
  const params = useParams();
  const jobId = typeof params?.jobId === "string" ? params.jobId.trim() : "";
  const { user, loading: authLoading } = useAuth();
  const { active: subscriptionActive, loading: subscriptionLoading } = useSubscriptionActive(user?.id);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    if (authLoading || subscriptionLoading) return;
    if (user && !subscriptionActive && jobId) {
      setShowPayModal(true);
    }
  }, [user, subscriptionActive, subscriptionLoading, jobId]);

  if (!jobId) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-4">
        <p className="text-slate-600">İlan bulunamadı.</p>
      </div>
    );
  }

  if (authLoading || subscriptionLoading) {
    return <LoadingShell />;
  }

  if (!user) {
    return <LoadingShell />;
  }

  // Abonelik yok: 89 TL haftalık popup göster (layout bu sayfayı render etmeye izin veriyor)
  if (!subscriptionActive) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Nasıl Başvururum Paneli</h1>
          <p className="mt-2 text-slate-600">
            Bu ilan için rehber ve soru akışına erişmek için haftalık premium aboneliği başlatın veya kupon kodunuzu girin.
          </p>
          <button
            type="button"
            onClick={() => setShowPayModal(true)}
            className="mt-4 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Haftalık 89 TL ile Başla
          </button>
        </div>
        <PremiumIntroModal
          open={showPayModal}
          onClose={() => setShowPayModal(false)}
          initialJobId={jobId}
          onPremiumSuccess={() => setShowPayModal(false)}
        />
      </div>
    );
  }

  // Abonelik var: ilan bilgisi ile soru akışı paneli
  return (
    <JobGuideErrorBoundary>
      <JobGuidePanel jobId={jobId} />
    </JobGuideErrorBoundary>
  );
}
