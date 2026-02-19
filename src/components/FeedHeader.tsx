"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Search, User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionCount } from "@/hooks/useSubscriptionCount";
import { PushNotificationButton } from "@/components/push/PushNotificationButton";

const FEED_PATH = "/ucretsiz-yurtdisi-is-ilanlari";

export type ChannelChip = { id: string; slug: string; name: string };

type FeedHeaderProps = {
  /** Mobil: sidebar drawer açmak için */
  onMenuClick?: () => void;
  /** Arama input (controlled) */
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Enter ile arama tetiklenir (opsiyonel, zaten debounce varsa boş bırakılabilir) */
  onSearchSubmit?: () => void;
  /** Chip seçimi */
  selectedChip: string;
  onChipClick: (slug: string) => void;
  /** Tümü + kanal listesi */
  channels: ChannelChip[];
  /** Base path for links (e.g. /ucretsiz-yurtdisi-is-ilanlari) */
  basePath?: string;
};

export function FeedHeader({
  onMenuClick,
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const loginUrl = `/giris?next=${encodeURIComponent(basePath)}`;

  return (
    <header
      className="sticky top-0 z-[1000] w-full border-b border-[#e5e7eb] bg-white/[0.92] backdrop-blur-[10px]"
      style={{
        boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
      }}
    >
      {/* Primary bar: Logo | Search | Actions */}
      <div className="flex h-12 min-h-12 items-center gap-2 px-3 sm:gap-3 sm:px-4 md:px-5">
        {/* Left: Hamburger (mobile) or Logo */}
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

        {/* Center: Search (hidden on mobile when collapsed) */}
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

        {/* Right: Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Mobile: search icon (toggle expand) */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((o) => !o)}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors md:hidden"
            aria-label="Ara"
          >
            <Search className="h-5 w-5" />
          </button>

          {!authLoading && user && subscriptionCount > 0 ? (
            <>
              <PushNotificationButton />
              <Link
                href="/aboneliklerim"
                className="relative flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 sm:px-3 sm:py-2 sm:text-sm"
                aria-label={`Aboneliklerim (${subscriptionCount})`}
              >
                <Bell className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Aboneliklerim</span>
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-0.5 text-[10px] font-bold text-brand-600 sm:-right-1 sm:-top-1 sm:h-4 sm:min-w-4 sm:text-xs">
                  {subscriptionCount}
                </span>
              </Link>
            </>
          ) : (
            <Link
              href={basePath}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 sm:px-3 sm:py-2 sm:text-sm"
              aria-label="Abone Ol"
            >
              <Bell className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Abone Ol</span>
            </Link>
          )}
          {!authLoading && user ? (
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

      {/* Mobile: expandable search row */}
      {mobileSearchOpen && (
        <div className="border-t border-slate-100 px-3 py-2 md:hidden">
          <input
            type="search"
            placeholder="Meslek ara… örn: Forklift operatörü"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (onSearchSubmit?.(), setMobileSearchOpen(false))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
          />
        </div>
      )}

      {/* Secondary bar: Chips */}
      <div className="border-t border-slate-100">
        <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-thin sm:px-4 md:px-5">
          <button
            type="button"
            onClick={() => onChipClick("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedChip === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tümü
          </button>
          {channels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => onChipClick(ch.slug)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedChip === ch.slug
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
