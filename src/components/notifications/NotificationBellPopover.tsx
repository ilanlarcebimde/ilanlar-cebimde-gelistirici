"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatPublishedAt } from "@/lib/formatTime";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import type { NotificationChannel } from "@/hooks/useNotifications";

const FLAG_CDN = "https://flagcdn.com";
const FEED_PATH = "/ucretsiz-yurtdisi-is-ilanlari";

type NotificationBellPopoverProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Auth: kanal listesi (yeni ilan bildirimleri) */
  channels: NotificationChannel[];
  totalBadge: number;
  loadingChannels: boolean;
  onMarkAllSeen: () => void;
  /** Auth ise true */
  isAuth: boolean;
  loginUrl: string;
};

export function NotificationBellPopover({
  open,
  onClose,
  anchorRef,
  channels,
  totalBadge,
  loadingChannels,
  onMarkAllSeen,
  isAuth,
  loginUrl,
}: NotificationBellPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: pushLoading,
    error: pushError,
    subscribe,
    unsubscribe,
  } = usePushSubscription();

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    window.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (open && isAuth && totalBadge > 0) onMarkAllSeen();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const handleToggle = async () => {
    if (isSubscribed) await unsubscribe();
    else await subscribe();
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-[1001] mt-1 w-[320px] rounded-xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-label="Bildirim ayarları"
    >
      {!isAuth ? (
        <div className="p-4">
          <p className="text-sm text-slate-700">
            Bildirimleri açmak için giriş yapın.
          </p>
          <Link
            href={loginUrl}
            onClick={onClose}
            className="mt-3 flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Giriş Yap
          </Link>
        </div>
      ) : (
        <div className="flex flex-col max-h-[min(70vh,420px)]">
          {/* Toggle: Bildirimler Açık/Kapalı */}
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-800">Bildirimler</span>
              <button
                type="button"
                onClick={handleToggle}
                disabled={pushLoading || !isSupported}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 ${
                  isSubscribed ? "bg-brand-600" : "bg-slate-200"
                }`}
                role="switch"
                aria-checked={isSubscribed}
                aria-label={isSubscribed ? "Bildirimler açık" : "Bildirimler kapalı"}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    isSubscribed ? "left-7 translate-x-0" : "left-1"
                  }`}
                />
              </button>
            </div>
            {permission === "denied" && (
              <p className="mt-2 text-xs text-amber-700">
                Tarayıcı bildirim izinleri kapalı. Açmak için tarayıcı ayarlarından bildirim iznini etkinleştirin.
              </p>
            )}
            {pushError && (
              <p className="mt-2 text-xs text-red-600">{pushError}</p>
            )}
          </div>

          {/* Kanallar / yeni ilan listesi */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2">
            <span className="text-xs font-medium text-slate-500">Yeni ilanlar</span>
            {totalBadge > 0 && (
              <button
                type="button"
                onClick={onMarkAllSeen}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            {loadingChannels ? (
              <div className="p-4 text-center text-sm text-slate-500">Yükleniyor…</div>
            ) : channels.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-600">Yeni bildirim yok</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(channels || []).map((ch) => {
                  const flagSrc = `${FLAG_CDN}/w40/${(ch.country_code || 'xx').toLowerCase()}.png`;
                  return (
                    <li key={ch.channel_id} className="px-4 py-2 hover:bg-slate-50">
                      <div className="flex items-start gap-2">
                        <span className="flex h-8 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                          <img src={flagSrc} alt="" className="h-full w-full object-contain" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-900 text-sm truncate">{ch.name}</span>
                            {ch.newCount > 0 && (
                              <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-xs font-semibold text-brand-700">
                                {ch.newCount}
                              </span>
                            )}
                          </div>
                          {ch.published_last_at && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatPublishedAt(ch.published_last_at)}
                            </p>
                          )}
                          <Link
                            href={ch.page_url || `${FEED_PATH}?c=${ch.slug}`}
                            onClick={onClose}
                            className="mt-1 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            Kanala git →
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
