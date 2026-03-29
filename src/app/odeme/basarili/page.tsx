"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";

/** PayTR callback bazen premium satırını gecikmeli yazar; tek refetch yetmez. */
const PREMIUM_POLL_ATTEMPTS = 45;
const PREMIUM_POLL_INTERVAL_MS = 500;

function isAllowedPremiumReturnPath(path: string): boolean {
  return (
    path.startsWith("/premium/job-guide/") ||
    path.startsWith("/ucretsiz-yurtdisi-is-ilanlari?openHowTo=") ||
    path.startsWith("/yurtdisi-is-basvuru-merkezi") ||
    path.startsWith("/yurtdisi-is-ilanlari/")
  );
}

export default function OdemeBasariliPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refetch } = useSubscriptionActive(user?.id, user?.email);
  const [verifyDone, setVerifyDone] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const redirectedRef = useRef(false);
  const [afterPaymentPanelPath] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const path = sessionStorage.getItem("premium_after_payment_redirect");
      if (path && isAllowedPremiumReturnPath(path)) {
        sessionStorage.removeItem("premium_after_payment_redirect");
        return path;
      }
      const jobId = sessionStorage.getItem("premium_pending_job_id");
      if (jobId) {
        sessionStorage.removeItem("premium_pending_job_id");
        return "/premium/job-guide/" + jobId;
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    sessionStorage.removeItem("paytr_pending");
    router.refresh();
    window.dispatchEvent(new Event("premium-subscription-invalidate"));
  }, [router]);

  // Abonelik satırı DB'ye yansıyana kadar tekrarlı doğrula; başarılı olunca hedef sayfaya tam yönlendirme
  useEffect(() => {
    if (!user) {
      setVerifyDone(true);
      return;
    }

    let cancelled = false;
    setVerifying(true);

    const target = afterPaymentPanelPath || "/premium/job-guides";

    void (async () => {
      window.dispatchEvent(new Event("premium-subscription-invalidate"));

      for (let attempt = 0; attempt < PREMIUM_POLL_ATTEMPTS; attempt++) {
        if (cancelled) return;
        const ok = await refetch();
        if (ok && !redirectedRef.current) {
          redirectedRef.current = true;
          setVerifying(false);
          setVerifyDone(true);
          window.location.href = target;
          return;
        }
        if (attempt < PREMIUM_POLL_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, PREMIUM_POLL_INTERVAL_MS));
        }
      }

      if (!cancelled) {
        setVerifying(false);
        setVerifyDone(true);
        setRedirectFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, refetch, afterPaymentPanelPath]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-soft text-center"
      >
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ödeme Başarılı</h1>
        <p className="text-slate-600 mb-4">
          Ödemeniz alındı. Haftalık premium aboneliğiniz hesabınıza işleniyor.
        </p>

        {verifying ? (
          <p className="mb-6 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Aboneliğiniz doğrulanıyor… Birkaç saniye içinde panele yönlendirileceksiniz.
          </p>
        ) : null}

        {verifyDone && redirectFailed ? (
          <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Abonelik henüz sistemde görünmüyor; ödeme birkaç saniye içinde tamamlanır. Aşağıdaki bağlantıya tıklayın veya
            sayfayı kısa süre sonra yenileyin.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 justify-center">
          <Link
            href={afterPaymentPanelPath || "/premium/job-guides"}
            className="inline-block rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
          >
            {afterPaymentPanelPath ? "Başvuru panelini aç" : "Nasıl Başvururum paneline git"}
          </Link>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/ucretsiz-yurtdisi-is-ilanlari"
              className="inline-block rounded-xl bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
            >
              İlanlara Git
            </Link>
            <Link
              href="/"
              className="inline-block rounded-xl bg-slate-800 px-6 py-3 font-medium text-white hover:bg-slate-700"
            >
              Ana Sayfa
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
