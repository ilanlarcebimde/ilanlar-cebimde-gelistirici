"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

const KURUMSAL_ITEMS = ["Hakkımızda", "İletişim", "SSS"];

const POLITIKALAR_ITEMS = [
  "Çerez Politikası",
  "Gizlilik Politikası",
  "Hizmet Sözleşmesi",
  "Kullanım Koşulları",
  "İade ve Geri Ödeme",
  "Alışveriş Güvenliği",
  "Müşteri Hizmetleri Politikası",
  "Mesafeli Satış Sözleşmesi",
  "Sorumluluk Reddi Beyanı",
  "Uluslararası Yasal Uyum",
];

const LIST_DOT = (
  <span className="mr-2 inline-block h-1 w-1 shrink-0 rounded-full bg-slate-400/70" aria-hidden />
);

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
    <footer className="border-t border-slate-200/70 bg-slate-50/40">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        {/* Üst katman: 4 kolon */}
        <div className="grid gap-8 sm:gap-10 lg:gap-14 grid-cols-1 md:grid-cols-[1.3fr_0.9fr_1.6fr_1.1fr]">
          {/* 1. Brand */}
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              İlanlar Cebimde
            </h2>
            <div className="mt-3 h-px w-6 bg-slate-200" aria-hidden />
            <p className="mb-4 mt-4 max-w-[38ch] text-sm leading-6 text-slate-600">
              Yurtdışında iş arayan adaylar için başvuru sürecini sadeleştiren,
              CV ve başvuru dokümanlarını tek akışta hazırlamayı hedefleyen bir
              platform.
            </p>
            <p className="text-xs leading-5 text-slate-500">
              İlanlar Cebimde, Yurtdışı Eleman markası ve ekosistemi bünyesinde
              yürütülen bir hizmettir.
            </p>
          </div>

          {/* 2. Kurumsal */}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">
              Kurumsal
            </h3>
            <div className="mt-3 h-px w-6 bg-slate-200" aria-hidden />
            <ul className="mb-4 mt-4 space-y-2">
              {KURUMSAL_ITEMS.map((label) => (
                <li
                  key={label}
                  className="flex items-start leading-6 min-w-0"
                >
                  {LIST_DOT}
                  <span
                    className="pointer-events-none cursor-default text-sm text-slate-600 transition-colors hover:text-slate-900"
                    aria-hidden
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Politikalar */}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">
              Politikalar
            </h3>
            <div className="mt-3 h-px w-6 bg-slate-200" aria-hidden />
            <ul className="mb-4 mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
              {POLITIKALAR_ITEMS.map((label) => (
                <li
                  key={label}
                  className="flex items-start min-w-0 leading-6 break-words"
                >
                  {LIST_DOT}
                  <span
                    className="pointer-events-none cursor-default text-sm text-slate-600 transition-colors hover:text-slate-900"
                    aria-hidden
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. İletişim */}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">
              İletişim
            </h3>
            <div className="mt-3 h-px w-6 bg-slate-200" aria-hidden />
            <div className="mb-4 mt-4 space-y-3">
              <p className="select-text text-sm font-medium leading-6 text-slate-700">
                destek@ilanlarcebimde.com
              </p>
              <p className="select-text text-sm font-medium leading-6 text-slate-700">
                destek@yurtdisieleman.net
              </p>
              <div className="flex items-center gap-2">
                <p className="select-text text-sm font-medium leading-6 text-slate-700">
                  WhatsApp: +90 501 142 10 52
                </p>
                <div className="relative shrink-0">
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setPopoverOpen((o) => !o)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
                    aria-label="WhatsApp hattı hakkında bilgi"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  {popoverOpen && (
                    <div
                      ref={popoverRef}
                      role="dialog"
                      aria-label="WhatsApp hattı bilgisi"
                      className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-lg"
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

        {/* Alt katman: divider + copyright */}
        <div className="mt-10 border-t border-slate-200/70 pt-6">
          <p className="text-xs text-slate-500">© 2026 İlanlar Cebimde</p>
        </div>
      </div>
    </footer>
  );
}
