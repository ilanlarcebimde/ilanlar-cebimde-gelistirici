"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Search, User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionCount } from "@/hooks/useSubscriptionCount";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { NotificationBellPopover } from "@/components/notifications/NotificationBellPopover";

const FEED_PATH = "/ucretsiz-yurtdisi-is-ilanlari";

export type ChannelChip = { id: string; slug: string; name: string };

type FeedHeaderProps = {
  /** Mobil: sol panel (abonelikler) açmak için */
  onMenuClick?: () => void;
  /** Feed sayfasında Aboneliklerim tıklanınca sol paneli aç/kapat (verilirse buton paneli toggle eder) */
  onAboneliklerimClick?: () => void;
  /** Arama input (controlled) */
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  selectedChip: string;
  onChipClick: (slug: string) => void;
  channels: ChannelChip[];
  basePath?: string;
};

export function FeedHeader({
  onMenuClick,
  onAboneliklerimClick,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  selectedChip,
  onChipClick,
  channels,
  basePath = FEED_PATH,
}: FeedHeaderProps) {
  const { user, loading: authLoading } = useAuth();
  const subscriptionCount = useSubscriptionCount(user?.id);
  const { channels: notificationChannels, totalBadge, loading: notificationsLoading, markAllSeen } = useNotifications(user?.id);
  const { isSubscribed } = usePushSubscription();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationAnchorRef = useRef<HTMLButtonElement>(null);

  const loginUrl = `/giris?next=${encodeURIComponent(basePath)}`;
  const loggedIn = !authLoading && !!user;
  const notificationActive = loggedIn && isSubscribed;

  return (
    <header
      className="sticky top-0 z-[1000] w-full border-b border-slate-200 bg-white/[0.92] backdrop-blur-[10px]"
      style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.05)" }}
    >
      {/* Primary bar */}
      <div className="flex h-12 min-h-12 items-center gap-2 px-3 sm:gap-3 sm:px-4 md:px-5">
        {/* Sol: Hamburger (mobil) + Logo */}
        <div className="flex shrink-0 items-center gap-2">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 -ml-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors lg:hidden"
              aria-label="Menüyü aç"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-900 min-w-0"
            aria-label="İlanlar Cebimde - Ana Sayfa"
          >
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain sm:h-8 sm:w-8"
              priority
            />
            <span className="hidden truncate text-base font-bold tracking-tight sm:block sm:text-lg">
              İlanlar Cebimde
            </span>
            <span className="truncate text-sm font-semibold sm:hidden">İlanlar Cebimde</span>
          </Link>
        </div>

        {/* Orta: Arama (masaüstü) */}
        <div className="hidden flex-1 justify-center md:flex md:max-w-[480px] lg:max-w-[680px]">
          <div className="relative w-full">
            <input
              type="search"
              placeholder="Meslek ara… örn: Forklift operatörü"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearchSubmit?.()}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2 pl-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Sağ: Zil + (Aboneliklerim masaüstü auth) + Abone Ol (guest) + Hesabım / Giriş Yap */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Mobil: arama ikonu */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((o) => !o)}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors md:hidden"
            aria-label="Ara"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Tek bildirim ikonu: tıklanınca popover (guest = giriş CTA, auth = toggle + liste) */}
          <div className="relative">
            <button
              ref={notificationAnchorRef}
              type="button"
              onClick={() => setNotificationOpen((o) => !o)}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-[0.98] sm:h-10 sm:w-10 ${
                notificationActive
                  ? "text-brand-600 bg-brand-50 hover:bg-brand-100 active:bg-brand-100"
                  : "text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 active:bg-slate-200 active:text-slate-800"
              }`}
              aria-label={totalBadge > 0 ? `${totalBadge} yeni bildirim` : "Bildirimler"}
            >
              <Bell className="h-5 w-5 shrink-0" strokeWidth={2.25} />
              {loggedIn && totalBadge > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white sm:-right-1 sm:-top-1">
                  {totalBadge > 99 ? "99+" : totalBadge}
                </span>
              )}
            </button>
            <NotificationBellPopover
              open={notificationOpen}
              onClose={() => setNotificationOpen(false)}
              anchorRef={notificationAnchorRef}
              channels={notificationChannels}
              totalBadge={totalBadge}
              loadingChannels={notificationsLoading}
              onMarkAllSeen={markAllSeen}
              isAuth={loggedIn}
              loginUrl={loginUrl}
            />
          </div>

          {/* Masaüstü auth: Aboneliklerim (feed’de panel toggle, değilse link) */}
          {loggedIn && (
            <>
              {onAboneliklerimClick ? (
                <button
                  type="button"
                  onClick={onAboneliklerimClick}
                  className="hidden lg:flex relative items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                  aria-label={`Aboneliklerim (${subscriptionCount})`}
                >
                  Aboneliklerim
                  {subscriptionCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand-600">
                      {subscriptionCount}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  href="/aboneliklerim"
                  className="hidden lg:flex relative items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                  aria-label={`Aboneliklerim (${subscriptionCount})`}
                >
                  Aboneliklerim
                  {subscriptionCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand-600">
                      {subscriptionCount}
                    </span>
                  )}
                </Link>
              )}
            </>
          )}

          {/* Guest: Abone Ol (sadece metin, ikon yok) — masaüstü ve mobil */}
          {!loggedIn && (
            <Link
              href={basePath}
              className="flex items-center rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 sm:px-3 sm:py-2 sm:text-sm"
              aria-label="Abone Ol"
            >
              Abone Ol
            </Link>
          )}

          {/* Hesabım / Giriş Yap */}
          {loggedIn ? (
            <Link
              href="/panel"
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:px-3 sm:py-2 sm:text-sm"
              aria-label="Hesabım"
            >
              <User className="h-4 w-4 shrink-0 sm:hidden" />
              <span className="hidden sm:inline">Hesabım</span>
            </Link>
          ) : (
            <Link
              href={loginUrl}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700 sm:px-3 sm:py-2 sm:text-sm"
            >
              <User className="h-4 w-4 shrink-0 sm:hidden" />
              <span className="hidden sm:inline">Giriş Yap</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobil: açılır arama satırı */}
      {mobileSearchOpen && (
        <div className="border-t border-slate-100 px-3 py-2 md:hidden">
          <input
            type="search"
            placeholder="Meslek ara…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (onSearchSubmit?.(), setMobileSearchOpen(false))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
          />
        </div>
      )}

      {/* Chips */}
      <div className="border-t border-slate-100">
        <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-thin sm:px-4 md:px-5">
          <button
            type="button"
            onClick={() => onChipClick("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedChip === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tümü
          </button>
          {(channels || []).map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => onChipClick(ch.slug)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedChip === ch.slug ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
