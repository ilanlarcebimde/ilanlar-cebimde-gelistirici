"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldCheck,
  FileCheck,
  Building2,
  Link2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMySubscriptionSlugs } from "@/hooks/useMySubscriptionSlugs";
import { supabase } from "@/lib/supabase";
import { ChannelsHeader } from "@/components/ilanlar/ChannelsHeader";
import { CountryCard } from "@/components/ilanlar/CountryCard";
import { Footer } from "@/components/layout/Footer";

const ULKELER_ID = "ulkeler";

const STRIP_ITEMS: Array<{ icon: React.ReactElement; label: string }> = [
  { icon: <Search className="h-[14px] w-[14px]" />, label: "Güncel ilanları araştırıyoruz" },
  { icon: <ShieldCheck className="h-[14px] w-[14px]" />, label: "Resmi kaynakları kontrol ediyoruz" },
  { icon: <FileCheck className="h-[14px] w-[14px]" />, label: "Vize duyurularını takip ediyoruz" },
  { icon: <Building2 className="h-[14px] w-[14px]" />, label: "Şirket bilgilerini derliyoruz" },
  { icon: <Link2 className="h-[14px] w-[14px]" />, label: "Güvenli yönlendirme sağlıyoruz" },
];

const COUNTRIES = [
  {
    id: "katar",
    flagCode: "qa",
    name: "Katar",
    description:
      "Katar’daki güncel iş ilanları ve resmi duyurular. Bölgeye özel fırsatlar.",
  },
  {
    id: "irlanda",
    flagCode: "ie",
    name: "İrlanda",
    description:
      "İrlanda iş piyasası ve vize duyuruları. AB üyesi ülke fırsatları.",
  },
  {
    id: "alaska",
    flagCode: "us",
    name: "Alaska",
    description:
      "ABD Alaska bölgesi iş ilanları ve çalışma izni bilgileri.",
  },
  {
    id: "belcika",
    flagCode: "be",
    name: "Belçika",
    description:
      "Belçika’daki güncel iş ilanları ve resmi kaynaklara yönlendirme.",
  }
] as const;

export function IlanlarPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const subscribedSlugs = useMySubscriptionSlugs(user?.id);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const scrollToUlkeler = useCallback(() => {
    document.getElementById(ULKELER_ID)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#ulkeler") {
      const el = document.getElementById(ULKELER_ID);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleSubscribe = useCallback(
    async (slug: string) => {
      if (!user) {
        router.push(`/kanal/${slug}`);
        return;
      }
      setSubmitting(slug);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          router.push(`/kanal/${slug}`);
          return;
        }
        const res = await fetch("/api/subscriptions/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ channelSlug: slug }),
        });
        if (!res.ok) {
          router.push(`/kanal/${slug}`);
          return;
        }
        router.push(`/kanal/${slug}`);
      } finally {
        setSubmitting(null);
      }
    },
    [user, router]
  );

  return (
    <div className="min-h-screen bg-white">
      <ChannelsHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/70">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
          >
            <div className="absolute -top-24 left-1/2 h-[320px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18),rgba(14,165,233,0)_65%)] blur-2xl" />
            <div className="absolute -bottom-40 left-10 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(2,132,199,0.12),rgba(2,132,199,0)_70%)] blur-2xl" />
          </div>

          <div className="mx-auto max-w-4xl px-4 pt-14 pb-16 text-center sm:pt-20 sm:pb-20">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Yurtdışı İş İlanları
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 sm:text-xl">
              <span className="block">
                Biz sizin için araştırıyor, doğruluyor ve tek merkezde sunuyoruz.
              </span>
              <span className="mt-1 block">
                Güncel iş ilanları, resmi duyurular ve güvenli başvuru bağlantıları burada.
              </span>
            </p>
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={scrollToUlkeler}
                className="w-full max-w-md rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-4 text-base font-semibold text-white shadow-[0_18px_50px_rgba(14,165,233,0.25)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_24px_65px_rgba(14,165,233,0.30)] hover:from-brand-700 hover:to-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:px-10 sm:py-4"
              >
                Kanallara Abone Ol ve Takibe Başla
              </button>
            </div>
          </div>
        </section>

        {/* Bilgi şeridi – minimal, kart yok */}
        <section className="border-t border-slate-100 bg-[#f8fafc] py-5 sm:py-6" aria-labelledby="strip-heading">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 id="strip-heading" className="mb-3 text-center text-sm font-semibold text-slate-500 sm:mb-4">
              Sizin İçin Neler Yapıyoruz?
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-[14px] text-slate-600 sm:gap-x-5 sm:text-[15px]">
              {STRIP_ITEMS.map((item, i) => (
                <span key={item.label} className="flex items-center gap-x-2">
                  {i > 0 && (
                    <span className="hidden text-slate-300 sm:inline" aria-hidden>
                      |
                    </span>
                  )}
                  <span className="flex shrink-0 items-center justify-center text-brand-600">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Ülke kanal kartları */}
        <section
          id={ULKELER_ID}
          className="scroll-mt-20 py-16 sm:py-20"
          aria-labelledby="ulkeler-baslik"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="mx-auto max-w-2xl text-center text-sm font-semibold text-brand-700">
              4 ülkede aktif iş akışı – her gün güncellenir.
            </p>
            <h2
              id="ulkeler-baslik"
              className="mt-3 text-center text-2xl font-bold text-slate-900 sm:text-3xl"
            >
              Takip Etmek İstediğiniz Ülkeyi Seçin
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {COUNTRIES.map((c) => (
                <CountryCard
                  key={c.id}
                  flagCode={c.flagCode}
                  name={c.name}
                  description={c.description}
                  countryId={c.id}
                  subscribed={subscribedSlugs.has(c.id)}
                  onSubscribe={handleSubscribe}
                  feedHref={`/kanal/${c.id}`}
                  isSubmitting={submitting === c.id}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
