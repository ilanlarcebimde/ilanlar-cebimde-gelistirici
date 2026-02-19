"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionCount } from "@/hooks/useSubscriptionCount";

const ULKELER_ID = "ulkeler";

function scrollToUlkeler() {
  document.getElementById(ULKELER_ID)?.scrollIntoView({ behavior: "smooth" });
}

export function ChannelsHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const subscriptionCount = useSubscriptionCount(user?.id);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ctaClass = scrolled
    ? "rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:rounded-2xl sm:px-4"
    : "rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:rounded-2xl sm:px-5";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-md"
          : "border-b border-slate-200/40 bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 text-slate-900"
          aria-label="İlanlar Cebimde - Ana Sayfa"
        >
          <Image
            src="/logo.png"
            alt="İlanlar Cebimde"
            width={36}
            height={36}
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 object-contain"
            priority
          />
          <span className="truncate text-lg font-bold tracking-tight sm:text-xl">
            İlanlar Cebimde
          </span>
        </Link>

        <nav className="hidden shrink-0 sm:flex items-center gap-6">
          <button
            type="button"
            onClick={scrollToUlkeler}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Kanallar
          </button>
          <Link
            href="/sss"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Nasıl Çalışır?
          </Link>
        </nav>

        {user && subscriptionCount > 0 ? (
          <Link
            href="/aboneliklerim"
            className={`flex shrink-0 items-center gap-2 ${ctaClass}`}
            aria-label="Aboneliklerim"
          >
            <Bell className="h-4 w-4 shrink-0" aria-hidden />
            <span>Aboneliklerim</span>
          </Link>
        ) : (
          <Link
            href="/yurtdisi-is-ilanlari#ulkeler"
            className={`flex shrink-0 items-center gap-2 ${ctaClass}`}
            aria-label="Kanallara abone ol - ülke seçimi"
          >
            <Bell className="h-4 w-4 shrink-0" aria-hidden />
            <span>Abone Ol</span>
          </Link>
        )}
      </div>
    </header>
  );
