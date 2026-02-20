"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { supabase } from "@/lib/supabase";

const FEED_PATH = "/ucretsiz-yurtdisi-is-ilanlari";

export function Header({ onLoginClick }: { onLoginClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
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
        <div className="mx-auto flex h-14 min-h-14 max-h-14 flex-nowrap items-center gap-2 px-3 sm:gap-3 sm:px-4 md:px-5 max-w-[1200px]">
          {/* Sol: Logo + Başlık (hamburger yok, alan serbest) */}
          <Link
            href="/"
            className="flex min-w-0 shrink items-center gap-2 text-slate-900"
            aria-label="İlanlar Cebimde - Ana Sayfa"
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
              priority
            />
            <span className="hidden truncate text-base font-bold tracking-tight sm:block sm:text-lg min-w-0">
              İlanlar Cebimde
            </span>
            <span className="truncate text-sm font-bold sm:hidden min-w-0">İlanlar Cebimde</span>
          </Link>

          {/* Sağ: Duruma göre Aboneliklerim + Bildirim + Menü veya Giriş Yap + Abone Ol + Menü */}
          <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-1 sm:gap-2">
            {loggedIn ? (
              <>
                {/* Aboneliklerim (ikon yok) → Feed */}
                <Link
                  href={FEED_PATH}
                  className="shrink-0 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:px-4 min-h-[40px] min-w-[40px] flex items-center justify-center"
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
                <Link
                  href={FEED_PATH}
                  className="shrink-0 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 min-h-[40px] flex items-center justify-center sm:px-4"
                >
                  Abone Ol
                </Link>
              </>
            )}

            {/* Hamburger sadece oturum açıkken */}
            {loggedIn && (
            <div className="relative flex shrink-0" ref={menuRef}>
              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-10 w-10 min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 active:bg-slate-200"
                aria-label="Menü"
                aria-expanded={menuOpen}
              >
                <Menu className="h-5 w-5" strokeWidth={2} />
              </button>

              {/* Dropdown: header altında, sağa hizalı, kart görünümü */}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[998]"
                    aria-hidden
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full z-[1001] mt-1 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-[0_10px_40px_rgba(0,0,0,0.12)]"
                    role="dialog"
                    aria-label="Menü"
                  >
                    {loggedIn ? (
                      <>
                        <Link
                          href="/panel"
                          className="block px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          Hesabım
                        </Link>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Çıkış Yap
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                          onClick={() => {
                            setMenuOpen(false);
                            onLoginClick();
                          }}
                        >
                          Giriş Yap
                        </button>
                        <Link
                          href={FEED_PATH}
                          className="block px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          Abone Ol
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
