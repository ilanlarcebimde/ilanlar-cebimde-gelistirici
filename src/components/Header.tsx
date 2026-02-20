"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, Menu, LayoutList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePushSubscription } from "@/hooks/usePushSubscription";

const FEED_PATH = "/ucretsiz-yurtdisi-is-ilanlari";

export function Header({ onLoginClick }: { onLoginClick: () => void }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const { user, loading } = useAuth();
  const { isSubscribed, isSupported, subscribe, unsubscribe, isLoading: pushLoading } = usePushSubscription();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    if (q) router.push(`${FEED_PATH}?q=${encodeURIComponent(q)}`);
    else router.push(FEED_PATH);
    setMenuOpen(false);
  };

  const handleNotificationClick = async () => {
    if (!user) {
      onLoginClick();
      return;
    }
    if (!isSupported) return;
    if (isSubscribed) await unsubscribe();
    else await subscribe();
  };

  const notificationIconActive = !!user && isSubscribed;

  return (
    <>
      <header
        className={`sticky top-0 z-[1000] w-full border-b bg-white/85 backdrop-blur-md transition-shadow duration-200 ${
          scrolled ? "border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex h-14 min-h-14 max-h-14 flex-nowrap items-center gap-2 px-3 sm:gap-3 sm:px-4 md:px-5 max-w-[1200px]">
          {/* Sol: Hamburger + Logo + Başlık */}
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Menü"
            >
              <Menu className="h-5 w-5" />
            </button>
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
          </div>

          {/* Orta: Arama */}
          <form
            onSubmit={handleSearch}
            className="flex min-w-0 flex-1 justify-center md:max-w-[320px] lg:max-w-[400px]"
          >
            <div className="relative w-full min-w-0">
              <input
                type="search"
                placeholder="Meslek ara…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/80 py-2 pl-3 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Ara"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Sağ: Bildirim ikonu + Aboneliklerim + Giriş / Hesabım */}
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            {/* Sadece ikon: bildirim açıksa mavi, kapalıysa gri */}
            <button
              type="button"
              onClick={handleNotificationClick}
              disabled={pushLoading && !!user}
              className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10 ${
                notificationIconActive
                  ? "text-brand-600 hover:bg-brand-50"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              } disabled:opacity-50`}
              aria-label={notificationIconActive ? "Bildirimler açık" : "Bildirimler"}
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* Aboneliklerim: ikon yok, her zaman görünsün → FEED */}
            <Link
              href={FEED_PATH}
              className="shrink-0 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:px-4"
              aria-label="Aboneliklerim"
            >
              <span className="hidden sm:inline">Aboneliklerim</span>
              <LayoutList className="h-4 w-4 sm:hidden" aria-hidden />
            </Link>

            {/* Giriş Yap / Hesabım */}
            {!loading && user ? (
              <Link
                href="/panel"
                className="shrink-0 rounded-xl border-2 border-slate-800 px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 sm:px-4"
              >
                Hesabım
              </Link>
            ) : (
              <button
                type="button"
                onClick={onLoginClick}
                className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 sm:px-4"
              >
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobil menü overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed left-0 top-0 z-[1001] h-full w-64 max-w-[85vw] transform border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-label="Menü"
      >
        <div className="flex flex-col gap-1 pt-16 px-3">
          <Link
            href={FEED_PATH}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => setMenuOpen(false)}
          >
            Aboneliklerim
          </Link>
          {user ? (
            <Link
              href="/panel"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => setMenuOpen(false)}
            >
              Hesabım
            </Link>
          ) : (
            <button
              type="button"
              className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 w-full"
              onClick={() => {
                setMenuOpen(false);
                onLoginClick();
              }}
            >
              Giriş Yap
            </button>
          )}
        </div>
      </div>
    </>
  );
}
