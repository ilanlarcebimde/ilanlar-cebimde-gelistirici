"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MethodSelectionModal } from "@/components/MethodSelectionModal";
import { WizardArea } from "@/components/wizard/WizardArea";
import { CountriesAndJobsSection } from "@/components/CountriesAndJobsSection";
import { CvWhySection } from "@/components/CvWhySection";
import { WhatWeSolveSection } from "@/components/WhatWeSolveSection";
import { FinalCtaSection } from "@/components/FinalCtaSection";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { StickyCta } from "@/components/StickyCta";
import type { WizardMethod } from "@/components/wizard/WizardTypes";
import { FileEdit } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [method, setMethod] = useState<WizardMethod | null>(null);
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [paymentPayload, setPaymentPayload] = useState<{ email: string; user_name?: string } | null>(null);

  const handleLoginClick = useCallback(() => setAuthOpen(true), []);

  const openMethodModal = useCallback(() => {
    setMethodModalOpen(true);
    document.getElementById("yontem-secimi")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handlePaymentClick = useCallback((payload: { email: string; user_name?: string }) => {
    setPaymentPayload(payload);
    setAuthOpen(true);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setAuthOpen(false);
    if (paymentPayload) {
      sessionStorage.setItem("paytr_pending", JSON.stringify({
        email: paymentPayload.email,
        user_name: paymentPayload.user_name,
      }));
      setPaymentPayload(null);
      window.location.href = "/odeme";
    }
  }, [paymentPayload]);

  const handleGoogleAuth = useCallback(async () => {
    console.log("Google sign-in");
    handleAuthSuccess();
  }, [handleAuthSuccess]);

  const handleEmailAuth = useCallback(
    async (email: string, password: string) => {
      console.log("Email sign-in", email);
      handleAuthSuccess();
    },
    [handleAuthSuccess]
  );

  return (
    <>
      <Header onLoginClick={handleLoginClick} />
      <main>
        <Hero onCtaClick={openMethodModal} />
        <section id="yontem-secimi" className="py-10 sm:py-12 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <p className="text-slate-600 mb-4">CV bilgilerinizi toplamak için bir yöntem seçin.</p>
            <button
              type="button"
              onClick={() => setMethodModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-medium text-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              <FileEdit className="h-5 w-5" />
              CV Bilgilerini Nasıl Alacağız? — Yöntem seçin
            </button>
          </div>
        </section>
        <WizardArea selectedMethod={method} onPaymentClick={handlePaymentClick} userId={user?.id} />
        <CountriesAndJobsSection />
        <CvWhySection />
        <WhatWeSolveSection />
        <FinalCtaSection onCtaClick={openMethodModal} />
        <Footer />
      </main>
      <StickyCta onCtaClick={openMethodModal} />

      <AnimatePresence>
        <MethodSelectionModal
          open={methodModalOpen}
          onClose={() => setMethodModalOpen(false)}
          onSelect={(id) => {
            setMethod(id);
            setMethodModalOpen(false);
          }}
          selectedMethod={method}
        />
        <AuthModal
          open={authOpen}
          onClose={() => {
            setAuthOpen(false);
            setPaymentPayload(null);
          }}
          onGoogle={handleGoogleAuth}
          onEmailSubmit={handleEmailAuth}
          redirectNext={paymentPayload ? "/odeme" : "/panel"}
        />
      </AnimatePresence>
    </>
  );
}
