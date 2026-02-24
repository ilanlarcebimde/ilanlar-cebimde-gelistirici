"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";

export default function OdemeBasariliPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { active: subscriptionActive, refetch } = useSubscriptionActive(user?.id);
  const [premiumChecked, setPremiumChecked] = useState(false);
  const [afterPaymentPanelPath] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const path = sessionStorage.getItem("premium_after_payment_redirect");
      if (path && path.startsWith("/premium/job-guide/")) {
        sessionStorage.removeItem("premium_after_payment_redirect");
        const id = path.replace(/^\/premium\/job-guide\/?/, "").split("/")[0]?.trim();
        if (id) return "/premium/job-guides?jobId=" + encodeURIComponent(id);
      }
      const jobId = sessionStorage.getItem("premium_pending_job_id");
      if (jobId) {
        sessionStorage.removeItem("premium_pending_job_id");
        return "/premium/job-guides?jobId=" + encodeURIComponent(jobId);
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    sessionStorage.removeItem("paytr_pending");
    router.refresh();
    // Tüm premium subscription hook'larının yeniden fetch etmesi için (feed, layout vb.)
    window.dispatchEvent(new Event("premium-subscription-invalidate"));
  }, [router]);

  // Ödeme dönüşünde abonelik durumunu hemen kontrol et; "Premium aktif" ve panele link için
  useEffect(() => {
    if (!user) return;
    window.dispatchEvent(new Event("premium-subscription-invalidate"));
    const t = setTimeout(() => {
      refetch().then(() => setPremiumChecked(true));
    }, 300);
    return () => clearTimeout(t);
  }, [user, refetch]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-soft text-center"
      >
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ödeme Başarılı</h1>
        <p className="text-slate-600 mb-8">
          Ödemeniz alındı. Usta Başvuru Paketiniz hazırlanıyor; CV ve bonuslar en kısa sürede panelinizde yer alacak.
        </p>
        {premiumChecked && subscriptionActive && (
          <p className="text-sm font-medium text-emerald-600 mb-6">
            Premium paketiniz aktif. İlanlardan &quot;Nasıl Başvururum?&quot; ile panele gidebilirsiniz.
          </p>
        )}
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
