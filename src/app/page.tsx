"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MethodSelection } from "@/components/MethodSelection";
import { WizardModal } from "@/components/WizardModal";
import { CountriesAndJobsSection } from "@/components/CountriesAndJobsSection";
import { CvWhySection } from "@/components/CvWhySection";
import { WhatWeSolveSection } from "@/components/WhatWeSolveSection";
import { FinalCtaSection } from "@/components/FinalCtaSection";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { StickyCta } from "@/components/StickyCta";
import type { WizardMethod } from "@/components/wizard/WizardTypes";

export default function Home() {
  const { user } = useAuth();
  const [method, setMethod] = useState<WizardMethod | null>(null);
  const [wizardModalOpen, setWizardModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [paymentPayload, setPaymentPayload] = useState<{ email: string; user_name?: string } | null>(null);

  const handleLoginClick = useCallback(() => setAuthOpen(true), []);

  const scrollToMethods = useCallback(() => {
    document.getElementById("yontem-secimi")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleMethodSelect = useCallback((id: WizardMethod) => {
    setMethod(id);
    setWizardModalOpen(true);
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
        <Hero onCtaClick={scrollToMethods} />
        <MethodSelection selectedMethod={method} onSelect={handleMethodSelect} />
        <CountriesAndJobsSection />
        <CvWhySection />
        <WhatWeSolveSection />
        <FinalCtaSection onCtaClick={scrollToMethods} />
        <Footer />
      </main>
      <StickyCta onCtaClick={scrollToMethods} />

      <WizardModal
        open={wizardModalOpen}
        onClose={() => setWizardModalOpen(false)}
        selectedMethod={method}
        onPaymentClick={handlePaymentClick}
        userId={user?.id}
      />

      <AnimatePresence>
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
