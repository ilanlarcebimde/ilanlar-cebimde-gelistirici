"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { MethodSelection } from "@/components/MethodSelection";
import { WizardModal } from "@/components/WizardModal";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Check } from "lucide-react";
import type { WizardMethod } from "@/components/wizard/WizardTypes";

const CV_PACKAGE_ITEMS = [
  "Türkçe CV (uluslararası standartlara uygun)",
  "İngilizce CV (uluslararası standartlara uygun)",
  "İş başvuru mektubu (yurtdışı başvurularına uyumlu)",
];

const PRICE = 349;

export default function YurtdisiCvPaketiPage() {
  const { user } = useAuth();
  const [method, setMethod] = useState<WizardMethod | null>(null);
  const [wizardModalOpen, setWizardModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [paymentPayload, setPaymentPayload] = useState<{
    email: string;
    user_name?: string;
    method?: string;
    country?: string;
    job_area?: string;
    job_branch?: string;
    answers?: Record<string, unknown>;
    photo_url?: string | null;
    plan?: "cv_package";
  } | null>(null);

  const handleLoginClick = useCallback(() => setAuthOpen(true), []);

  const handleMethodSelect = useCallback((id: WizardMethod) => {
    setMethod(id);
    setWizardModalOpen(true);
  }, []);

  const handlePaymentClick = useCallback(
    (payload: {
      email: string;
      user_name?: string;
      method: "form" | "voice" | "chat";
      country: string;
      job_area: string;
      job_branch: string;
      answers: Record<string, unknown>;
      photo_url: string | null;
      plan?: "cv_package";
    }) => {
      setWizardModalOpen(false);
      sessionStorage.setItem("paytr_pending", JSON.stringify({ ...payload, plan: "cv_package" }));
      setPaymentPayload(null);
      setAuthOpen(false);
      window.location.href = "/odeme";
    },
    []
  );

  const handleAuthSuccess = useCallback(
    (loginEmail?: string) => {
      setAuthOpen(false);
      if (paymentPayload) {
        const email = loginEmail?.trim() || paymentPayload.email?.trim();
        if (email) {
          sessionStorage.setItem(
            "paytr_pending",
            JSON.stringify({
              ...paymentPayload,
              email,
              user_name: paymentPayload.user_name?.trim() || undefined,
              plan: "cv_package",
            })
          );
          setPaymentPayload(null);
          window.location.href = "/odeme";
        }
      }
    },
    [paymentPayload]
  );

  return (
    <>
      <Header onLoginClick={handleLoginClick} />
      <main className="min-h-screen bg-slate-50">
        <section className="bg-white border-b border-slate-200 py-10 sm:py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl mb-2">
              Yurtdışı CV Paketi
            </h1>
            <p className="text-slate-600 mb-6">
              Türkçe ve İngilizce CV’niz ile iş başvuru mektubunuz tek pakette. Form, sohbet veya sesli asistan ile doldurun.
            </p>
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-6 text-left">
              <span className="text-2xl font-bold text-slate-900">{PRICE} TL</span>
              <ul className="space-y-2">
                {CV_PACKAGE_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              <Link href="/" className="text-slate-600 hover:underline">Ana sayfaya dön</Link>
            </p>
          </div>
        </section>

        <MethodSelection selectedMethod={method} onSelect={handleMethodSelect} />
      </main>

      <WizardModal
        open={wizardModalOpen}
        onClose={() => setWizardModalOpen(false)}
        selectedMethod={method}
        onPaymentClick={handlePaymentClick}
        userId={user?.id}
        productPlan="cv_package"
      />

      <AnimatePresence>
        <AuthModal
          open={authOpen}
          onClose={() => {
            setAuthOpen(false);
            setPaymentPayload(null);
          }}
          onGoogle={handleAuthSuccess}
          onEmailSubmit={handleAuthSuccess}
          redirectNext={paymentPayload ? "/odeme" : "/panel"}
        />
      </AnimatePresence>
    </>
  );
}
