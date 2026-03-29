"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";
import { CvPackageHero } from "@/components/cv/CvPackageHero";
import { PaymentPausedNotice } from "@/components/platform/PaymentPausedNotice";

const headerApproxPx = 72;

export function YurtdisiCvPaketiClient() {
  const handleLoginClick = () => {
    if (typeof window !== "undefined") window.location.href = "/giris";
  };

  return (
    <>
      <Header onLoginClick={handleLoginClick} stickyTopClassName="top-0" />
      <main className="bg-slate-50">
        <CvPackageHero
          scrollAnchorOffsetPx={headerApproxPx}
          paymentsPaused
        />
        <div className="h-8 bg-gradient-to-b from-slate-900/12 to-transparent sm:h-10" aria-hidden />
        <div id="cv-wizard-start" className="relative -mt-8 pb-6 sm:-mt-10 sm:pb-8">
          <PaymentPausedNotice variant="inline" />
        </div>
      </main>
      <Footer />
    </>
  );
}
