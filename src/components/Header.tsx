"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { supabase } from "@/lib/supabase";
import { MobileHeader } from "@/components/header/MobileHeader";
import { MobileMenuSheet } from "@/components/header/MobileMenuSheet";

const FEED_PATH = "/ucretsiz-yurtdisi-is-ilanlari";
const NEWS_HUB_PATH = "/yurtdisi-calisma-ve-vize-duyurulari";

export function Header({ onLoginClick }: { onLoginClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const { isSubscribed, isSupported, subscribe, unsubscribe, isLoading: pushLoading } = usePushSubscription();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  const handleNotificationClick = async () => {
    if (!user) return;
    if (!isSupported) return;
    if (isSubscribed) await unsubscribe();
    else await subscribe();
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
  };

  const notificationIconActive = !!user && isSubscribed;
  const loggedIn = !loading && !!user;

  return (
    <>
      <header
        className={`sticky top-0 z-[1000] w-full border-b bg-white/95 backdrop-blur-md transition-shadow duration-200 ${
          scrolled ? "border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1360px] flex-nowrap items-center gap-2 px-4 py-2.5 md:h-14 md:min-h-14 md:max-h-14 md:gap-3 md:px-5 md:py-0">
          <MobileHeader
            loggedIn={loggedIn}
            onLoginClick={onLoginClick}
            onMenuClick={() => setMenuOpen(true)}
          />

          {/* Sol: Logo + Başlık */}
          <Link
            href="/"
            className="hidden shrink-0 items-center gap-2 text-slate-900 md:flex"
            aria-label="İlanlar Cebimde - Ana Sayfa"
          >
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
              priority
            />
            <span className="hidden whitespace-nowrap text-base font-bold tracking-tight sm:block sm:text-lg">
              İlanlar Cebimde
            </span>
          </Link>

          {/* Masaüstü: menü butonları sırayla (popup yok) */}
          <nav className="hidden md:flex items-center gap-0.5 shrink-0" aria-label="Ana menü">
            <Link
              href="/"
              className="rounded-lg px-2 py-2 text-[13px] lg:px-3 lg:text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Ana Sayfa
            </Link>
            <Link
              href="/yurtdisi-cv-paketi"
              className="rounded-lg px-2 py-2 text-[13px] lg:px-3 lg:text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Yurtdışı CV Paketi
            </Link>
            <Link
              href="/yurtdisi-is-basvuru-merkezi"
              className="rounded-lg px-2 py-2 text-[13px] lg:px-3 lg:text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Yurtdışı İş Başvuru Merkezi
            </Link>
            <Link
              href={FEED_PATH}
              className="rounded-lg px-2 py-2 text-[13px] lg:px-3 lg:text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Ücretsiz Yurtdışı İş İlanları
            </Link>
            <Link
              href={NEWS_HUB_PATH}
              className="rounded-lg px-2 py-2 text-[13px] lg:px-3 lg:text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Yurtdışı Çalışma & Vize Duyuruları
            </Link>
          </nav>

          {/* Sağ: Duruma göre Aboneliklerim + Bildirim + Menü veya Giriş Yap + (masaüstü: Abone Ol) + (mobil: Menü) */}
          <div className="ml-auto hidden shrink-0 flex-nowrap items-center gap-1 sm:gap-2 md:flex">
            {loggedIn ? (
              <>
                {/* Aboneliklerim (ikon yok) → Feed */}
                <Link
                  href={FEED_PATH}
                  className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm min-h-[36px] flex items-center justify-center sm:min-h-[40px]"
                  aria-label="Aboneliklerim"
                >
                  Aboneliklerim
                </Link>
                {/* Bildirim: canlı renk, basınca kaybolmayan ikon */}
                <button
                  type="button"
                  onClick={handleNotificationClick}
                  disabled={pushLoading}
                  className={`shrink-0 flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 ${
                    notificationIconActive
                      ? "text-brand-600 bg-brand-50 hover:bg-brand-100 active:bg-brand-100"
                      : "text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 active:bg-slate-200 active:text-slate-800"
                  }`}
                  aria-label={notificationIconActive ? "Bildirimler açık" : "Bildirimler"}
                >
                  <Bell className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 min-h-[40px] flex items-center justify-center sm:px-4"
                >
                  Giriş Yap
                </button>
                {/* Abone Ol sadece masaüstünde; mobilde yerine menü butonu kullanılıyor */}
                <Link
                  href={FEED_PATH}
                  className="hidden md:flex shrink-0 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 min-h-[40px] items-center justify-center sm:px-4"
                >
                  Abone Ol
                </Link>
              </>
            )}

          </div>
        </div>
      </header>
      <MobileMenuSheet
        open={menuOpen}
        loggedIn={loggedIn}
        feedPath={FEED_PATH}
        newsHubPath={NEWS_HUB_PATH}
        onClose={() => setMenuOpen(false)}
        onLoginClick={onLoginClick}
        onSignOut={handleSignOut}
      />
    </>
  );
}
