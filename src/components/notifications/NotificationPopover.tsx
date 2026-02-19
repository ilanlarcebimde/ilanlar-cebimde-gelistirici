"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatPublishedAt } from "@/lib/formatTime";
import type { NotificationChannel } from "@/hooks/useNotifications";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return isMobile;
}

const FLAG_CDN = "https://flagcdn.com";
const FEED_PATH = "/ucretsiz-yurtdisi-is-ilanlari";

type NotificationPopoverProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  channels: NotificationChannel[];
  totalBadge: number;
  loading: boolean;
  onMarkAllSeen: () => void;
};

export function NotificationPopover({
  open,
  onClose,
  anchorRef,
  channels,
  totalBadge,
  loading,
  onMarkAllSeen,
}: NotificationPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      )
        return;
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
    if (open && totalBadge > 0) {
      onMarkAllSeen();
    }
  }, [open]); // run once when popover opens to mark as seen

  if (!open) return null;

  const content = (
    <div className="flex flex-col max-h-[min(70vh,420px)]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 shrink-0">
        <div>
          <h3 className="font-semibold text-slate-900">Bildirimler</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Abone olduğun kanallarda yeni ilanlar
          </p>
        </div>
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
        {loading ? (
          <div className="p-4 text-center text-sm text-slate-500">
            Yükleniyor…
          </div>
        ) : channels.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-medium text-slate-700">Yeni bildirim yok</p>
            <p className="text-sm text-slate-500 mt-1">
              Abone olduğun kanallarda yeni ilan çıktığında burada görünecek.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {channels.map((ch) => {
              const flagSrc = `${FLAG_CDN}/w40/${ch.country_code.toLowerCase()}.png`;
              return (
                <li key={ch.channel_id} className="px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                      <img
                        src={flagSrc}
                        alt=""
                        className="h-full w-full object-contain object-center"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900 truncate">
                          {ch.name}
                        </span>
                        {ch.newCount > 0 && (
                          <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                            Yeni: {ch.newCount}
                          </span>
                        )}
                      </div>
                      {ch.published_last_at && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Son güncelleme: {formatPublishedAt(ch.published_last_at)}
                        </p>
                      )}
                      <Link
                        href={`${FEED_PATH}?c=${ch.slug}`}
                        onClick={onClose}
                        className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
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
  );

  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 z-[999] bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={panelRef}
          className="fixed bottom-0 left-0 right-0 z-[1000] max-h-[70vh] rounded-t-2xl border border-slate-200 bg-white shadow-xl md:hidden"
        >
          <div className="sticky top-0 h-1.5 w-12 shrink-0 rounded-full bg-slate-300 mx-auto mt-2" />
          {content}
        </div>
      </>
    );
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-[1001] mt-1 w-[360px] rounded-xl border border-slate-200 bg-white shadow-lg"
    >
      {content}
    </div>
  );
}
