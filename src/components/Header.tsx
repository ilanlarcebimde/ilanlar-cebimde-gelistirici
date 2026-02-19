"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionCount } from "@/hooks/useSubscriptionCount";
import { PushNotificationButton } from "@/components/push/PushNotificationButton";

export function Header({ onLoginClick }: { onLoginClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const subscriptionCount = useSubscriptionCount(user?.id);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md transition-shadow duration-200 ${
        scrolled ? "border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "border-transparent"
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
          <span className="truncate text-lg font-bold tracking-tight sm:text-xl">İlanlar Cebimde</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {!loading && user && subscriptionCount > 0 ? (
            <>
              <PushNotificationButton />
              <Link
                href="/aboneliklerim"
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:rounded-2xl sm:px-4"
                aria-label="Aboneliklerim"
              >
                <Bell className="h-4 w-4 shrink-0" aria-hidden />
                <span>Aboneliklerim</span>
              </Link>
            </>
          ) : (
            <Link
              href="/ucretsiz-yurtdisi-is-ilanlari"
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:rounded-2xl sm:px-4"
              aria-label="Yurtdışı İş İlanları kanallarına abone ol"
            >
              <Bell className="h-4 w-4 shrink-0" aria-hidden />
              <span>Abone Ol</span>
            </Link>
          )}
          {!loading && user ? (
            <Link
              href="/panel"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 sm:rounded-2xl sm:px-4"
            >
              Hesabım
            </Link>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 sm:rounded-2xl sm:px-4"
            >
              Giriş Yap
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
