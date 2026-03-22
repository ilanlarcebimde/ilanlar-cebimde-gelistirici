"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";
import { CvPackageHero } from "@/components/cv/CvPackageHero";
import { CvWizard } from "@/components/cv/CvWizard";
import { BottomPopup } from "@/components/cv/campaign/BottomPopup";
import { CvCampaignProvider, useCvCampaign } from "@/components/cv/campaign/CvCampaignContext";
import { TopCampaignBar } from "@/components/cv/campaign/TopCampaignBar";
import { CV_CAMPAIGN_BAR_HEIGHT_PX } from "@/components/cv/campaign/cvCampaignConstants";

const HERO_SCROLL_OFFSET_PX = 72 + CV_CAMPAIGN_BAR_HEIGHT_PX;

function YurtdisiCvPaketiInner() {
  const { notifyLeaveFirstStep, mainBottomPadding } = useCvCampaign();

  const handleLoginClick = () => {
    if (typeof window !== "undefined") window.location.href = "/giris";
  };

  return (
    <>
      <TopCampaignBar />
      <Header onLoginClick={handleLoginClick} stickyTopClassName="top-10" />
      <main
        className={`bg-slate-50 ${mainBottomPadding ? "pb-80 sm:pb-96" : ""}`}
      >
        <CvPackageHero scrollAnchorOffsetPx={HERO_SCROLL_OFFSET_PX} />
        <div className="h-6 bg-gradient-to-b from-slate-900/10 to-transparent" aria-hidden />
        <div className="relative -mt-8 sm:-mt-10 pb-6 sm:pb-8">
          <CvWizard onLeaveFirstStep={notifyLeaveFirstStep} />
        </div>
      </main>
      <div className={mainBottomPadding ? "pb-24 sm:pb-28" : ""}>
        <Footer />
      </div>
      <BottomPopup />
    </>
  );
}

export function YurtdisiCvPaketiClient() {
  return (
    <CvCampaignProvider>
      <YurtdisiCvPaketiInner />
    </CvCampaignProvider>
  );
}
