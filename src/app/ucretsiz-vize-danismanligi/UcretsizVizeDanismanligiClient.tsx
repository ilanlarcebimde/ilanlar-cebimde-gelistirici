"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";
import { VisaConsultingHero } from "@/components/visa-wizard/VisaConsultingHero";
import { VisaWizard } from "@/components/visa-wizard/VisaWizard";

export function UcretsizVizeDanismanligiClient() {
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleStart = useCallback(() => {
    setWizardOpen(true);
    requestAnimationFrame(() => {
      const target = document.getElementById("visa-wizard");
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 74;
      window.scrollTo({ top, behavior: "smooth" });
    });
  }, []);

  const handleLoginClick = () => {
    if (typeof window !== "undefined") window.location.href = "/giris";
  };

  return (
    <>
      <Header onLoginClick={handleLoginClick} />
      <main className="bg-slate-50">
        <VisaConsultingHero onStart={handleStart} />
        {wizardOpen ? (
          <section id="visa-wizard" className="py-6">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <VisaWizard />
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
