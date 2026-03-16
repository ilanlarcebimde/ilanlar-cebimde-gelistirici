"use client";

import { Header } from "@/components/Header";
import { CvPackageHero } from "@/components/cv/CvPackageHero";
import { CvWizard } from "@/components/cv/CvWizard";

export function YurtdisiCvPaketiClient() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <CvPackageHero />
        <div className="h-6 bg-gradient-to-b from-slate-900/10 to-transparent" aria-hidden />
        <div className="relative -mt-8 sm:-mt-10 pb-12">
          <CvWizard />
        </div>
      </main>
    </>
  );
}
