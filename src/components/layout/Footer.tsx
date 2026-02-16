"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

const KURUMSAL_ITEMS = [
  "Hakkımızda",
  "İletişim",
  "Sık Sorulan Sorular",
  "Politikalar",
];

export function Footer() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopoverOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      setPopoverOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverOpen]);

  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Sol blok — Kurumsal tanım */}
          <div className="flex flex-col">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              İlanlar Cebimde
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Yurtdışında iş arayan adaylar için başvuru sürecini sadeleştiren,
              CV ve başvuru dokümanlarını tek akışta hazırlamayı hedefleyen bir
              platform.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              İlanlar Cebimde, Yurtdışı Eleman markası ve ekosistemi bünyesinde
              yürütülen bir hizmettir.
            </p>
            <p className="mt-6 text-xs text-slate-400">
              © 2026 İlanlar Cebimde
            </p>
          </div>

          {/* Orta blok — Kurumsal */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Kurumsal</h3>
            <ul className="mt-4 space-y-2.5">
              {KURUMSAL_ITEMS.map((label) => (
                <li key={label}>
                  <span
                    className="cursor-default text-sm text-slate-600 transition-colors hover:text-slate-800"
                    aria-hidden
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sağ blok — İletişim */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800">İletişim</h3>
            <div className="mt-4 space-y-2.5">
              <p className="select-text text-sm text-slate-600">
                destek@ilanlarcebimde.com
              </p>
              <p className="select-text text-sm text-slate-600">
                destek@yurtdisieleman.net
              </p>
              <div className="flex items-center gap-1.5">
                <p className="select-text text-sm text-slate-600">
                  WhatsApp: +90 501 142 10 52
                </p>
                <div className="relative">
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setPopoverOpen((o) => !o)}
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50/80 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="WhatsApp hattı hakkında bilgi"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                  {popoverOpen && (
                    <div
                      ref={popoverRef}
                      role="dialog"
                      aria-label="WhatsApp hattı bilgisi"
                      className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-600 shadow-lg"
                    >
                      WhatsApp müşteri hizmetleri hattı Yurtdışı Eleman çatısı
                      altında yönetilmektedir.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
