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

  useEffect(() => {
    sessionStorage.removeItem("paytr_pending");
    router.refresh();
    // Tüm premium subscription hook'larının yeniden fetch etmesi için (feed, layout vb.)
    window.dispatchEvent(new Event("premium-subscription-invalidate"));
  }, [router]);

  // Ödeme dönüşünde abonelik durumunu bir kez kontrol et; "Premium aktif" göstermek için
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      refetch().then(() => setPremiumChecked(true));
    }, 800);
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
      </motion.div>
    </div>
  );
}
