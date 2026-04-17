"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PAYMENTS_PAUSED } from "@/lib/paymentsPaused";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";
import { CvPackageHero } from "@/components/cv/CvPackageHero";
import { CvWizard } from "@/components/cv/CvWizard";
import { CvCampaignProvider, useCvCampaign } from "@/components/cv/campaign/CvCampaignContext";
import { TopCampaignBar, useCvCampaignBarHeightSync } from "@/components/cv/campaign/TopCampaignBar";
import { CV_CAMPAIGN_BAR_HEIGHT_PX } from "@/components/cv/campaign/cvCampaignConstants";
import { PaymentPausedNotice } from "@/components/platform/PaymentPausedNotice";

const headerApproxPx = 72;

function YurtdisiCvPaketiInner() {
  const barHeightPx = useCvCampaignBarHeightSync();
  const HERO_SCROLL_OFFSET_PX = headerApproxPx + (barHeightPx || CV_CAMPAIGN_BAR_HEIGHT_PX);
  const { notifyLeaveFirstStep, mainBottomPadding } = useCvCampaign();

  const handleLoginClick = () => {
    if (typeof window !== "undefined") window.location.href = "/giris";
  };

  return (
    <>
      <TopCampaignBar />
      <Header onLoginClick={handleLoginClick} stickyTopClassName="top-[var(--cv-campaign-bar-height)]" />
      <main
        className={`bg-slate-50 ${mainBottomPadding ? "pb-80 sm:pb-96" : ""}`}
      >
        <CvPackageHero scrollAnchorOffsetPx={HERO_SCROLL_OFFSET_PX} />
        <div className="h-8 bg-gradient-to-b from-slate-900/12 to-transparent sm:h-10" aria-hidden />
        <div id="cv-wizard-start" className="relative -mt-8 pb-6 sm:-mt-10 sm:pb-8">
          <CvWizard onLeaveFirstStep={notifyLeaveFirstStep} />
        </div>
      </main>
      <div className={mainBottomPadding ? "pb-24 sm:pb-28" : ""}>
        <Footer />
      </div>
    </>
  );
}

export function YurtdisiCvPaketiClient() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { active: subscriptionActive, loading: subscriptionLoading } = useSubscriptionActive(
    userId ?? undefined,
    userEmail ?? undefined
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setUserEmail(data.user?.email ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLoginClick = () => {
    if (typeof window !== "undefined") window.location.href = "/giris";
  };

  if (authLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-600">
        Yükleniyor…
      </div>
    );
  }

  if (userId && subscriptionLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-600">
        Yükleniyor…
      </div>
    );
  }

  const accessBlocked = PAYMENTS_PAUSED && !subscriptionActive;

  if (accessBlocked) {
    return (
      <>
        <Header onLoginClick={handleLoginClick} stickyTopClassName="top-0" />
        <main className="bg-slate-50">
          <CvPackageHero scrollAnchorOffsetPx={headerApproxPx} paymentsPaused />
          <div className="h-8 bg-gradient-to-b from-slate-900/12 to-transparent sm:h-10" aria-hidden />
          <div id="cv-wizard-start" className="relative -mt-8 pb-6 sm:-mt-10 sm:pb-8">
            <PaymentPausedNotice variant="inline" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <CvCampaignProvider campaignPopupEnabled={false}>
      <YurtdisiCvPaketiInner />
    </CvCampaignProvider>
  );
}
