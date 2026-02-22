"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function OdemeBasariliPage() {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.removeItem("paytr_pending");
    router.refresh();
  }, [router]);

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
        <Link
          href="/"
          className="inline-block rounded-xl bg-slate-800 px-6 py-3 font-medium text-white hover:bg-slate-700"
        >
          Ana Sayfaya Dön
        </Link>
      </motion.div>
    </div>
  );
}
