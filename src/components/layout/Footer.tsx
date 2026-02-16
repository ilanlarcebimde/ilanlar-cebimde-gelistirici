"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Info } from "lucide-react";

const WHATSAPP_TOOLTIP_ID = "footer-whatsapp-tooltip";
const POPOVER_CONTENT =
  "WhatsApp müşteri hizmetleri hattı, Yurtdışı Eleman çatısı altında yönetilmektedir.";

const KURUMSAL_ITEMS = ["Hakkımızda", "İletişim", "SSS"];

const POLITIKALAR_SOL = [
  "Çerez Politikası",
  "Gizlilik Politikası",
  "Hizmet Sözleşmesi",
  "Kullanım Koşulları",
  "İade ve Geri Ödeme",
];

const POLITIKALAR_SAG = [
  "Alışveriş Güvenliği",
  "Müşteri Hizmetleri Politikası",
  "Mesafeli Satış Sözleşmesi",
  "Sorumluluk Reddi Beyanı",
  "Uluslararası Yasal Uyum",
];

type PlacementH = "right" | "left";
type PlacementV = "below" | "above";

const POPOVER_PAD = 12;
const POPOVER_GAP = 8;
const POPOVER_MIN_W = 220;

export function Footer() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [placement, setPlacement] = useState<{
    h: PlacementH;
    v: PlacementV;
  }>({ h: "right", v: "below" });
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Click outside + ESC
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

  // Reset position when closed so next open recalculates
  useEffect(() => {
    if (!popoverOpen) setPosition(null);
  }, [popoverOpen]);

  // Fixed position + clamp: keep popover inside viewport, no horizontal scroll
  useLayoutEffect(() => {
    if (!popoverOpen || !triggerRef.current || !popoverRef.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tr = triggerRef.current.getBoundingClientRect();
    const pr = popoverRef.current.getBoundingClientRect();

    let left: number;
    let top: number;
    let h: PlacementH = "right";
    let v: PlacementV = "below";

    // Prefer right of icon; clamp so we don't overflow right
    const leftPreferred = tr.right + POPOVER_GAP;
    left = Math.max(POPOVER_PAD, Math.min(leftPreferred, vw - pr.width - POPOVER_PAD));
    if (leftPreferred + pr.width > vw - POPOVER_PAD) h = "left";

    // Prefer below icon; flip above if no room
    if (tr.bottom + POPOVER_GAP + pr.height <= vh - POPOVER_PAD) {
      top = tr.bottom + POPOVER_GAP;
      v = "below";
    } else if (tr.top - POPOVER_GAP - pr.height >= POPOVER_PAD) {
      top = tr.top - pr.height - POPOVER_GAP;
      v = "above";
    } else {
      top = Math.max(POPOVER_PAD, Math.min(tr.bottom + POPOVER_GAP, vh - pr.height - POPOVER_PAD));
      v = "below";
    }
    top = Math.max(POPOVER_PAD, Math.min(top, vh - pr.height - POPOVER_PAD));

    setPlacement({ h, v });
    setPosition({ left, top });
  }, [popoverOpen]);

  return (
    <footer className="w-full max-w-full overflow-x-clip border-t border-slate-200/70 bg-slate-50/50">
      <div className="mx-auto min-w-0 max-w-6xl px-4 py-10 md:px-10 md:py-12">
        {/* Mobil: tek kolon (Brand → Kurumsal → İletişim → Politikalar); md+: 4 kolon */}
        <div className="grid min-w-0 grid-cols-1 gap-10 lg:gap-14 md:grid-cols-[1.35fr_0.85fr_1.7fr_1.1fr]">
          {/* 1. Brand */}
          <div className="min-w-0 md:order-1">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              İlanlar Cebimde
            </h2>
            <div className="mt-3 h-px w-8 bg-slate-200" aria-hidden />
            <p className="mt-4 max-w-[42ch] text-sm leading-6 text-slate-600">
              Yurtdışında iş arayan adaylar için başvuru sürecini sadeleştiren,
              CV ve başvuru dokümanlarını tek akışta hazırlamayı hedefleyen bir
              platform.
            </p>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              İlanlar Cebimde, Yurtdışı Eleman markası ve ekosistemi bünyesinde
              yürütülen bir hizmettir.
            </p>
          </div>

          {/* 2. Kurumsal - mobilde sol sütun */}
          <div className="min-w-0 md:order-2">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">
              Kurumsal
            </h3>
            <div className="mt-3 h-px w-8 bg-slate-200" aria-hidden />
            <ul className="mt-4 space-y-2">
              {KURUMSAL_ITEMS.map((label) => (
                <li key={label}>
                  <span
                    className="pointer-events-none cursor-default text-sm font-normal leading-6 text-slate-600 transition-colors hover:text-slate-900"
                    aria-hidden
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. İletişim - mobilde sağ sütun; masaüstünde 4. sütun */}
          <div className="min-w-0 md:order-4">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">
              İletişim
            </h3>
            <div className="mt-3 h-px w-8 bg-slate-200" aria-hidden />
            <div className="mt-4 w-full space-y-3 text-left">
              <p className="select-text text-sm font-medium leading-6 text-slate-700 [overflow-wrap:anywhere]">
                destek@ilanlarcebimde.com
              </p>
              <p className="select-text text-sm font-medium leading-6 text-slate-700 [overflow-wrap:anywhere]">
                destek@yurtdisieleman.net
              </p>
              <div className="flex w-full min-w-0 flex-wrap items-center gap-2">
                <span className="select-text text-sm font-medium leading-6 text-slate-700 [overflow-wrap:anywhere]">
                  WhatsApp: +90 501 142 10 52
                </span>
                <div className="relative max-w-full shrink-0 overflow-x-clip">
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setPopoverOpen((o) => !o)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1"
                    aria-label="WhatsApp hakkında bilgi"
                    aria-expanded={popoverOpen}
                    aria-controls={WHATSAPP_TOOLTIP_ID}
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  {popoverOpen && (
                    <div
                      ref={popoverRef}
                      id={WHATSAPP_TOOLTIP_ID}
                      role="tooltip"
                      aria-hidden={false}
                      className="z-50 flex rounded-[12px] border border-slate-200 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                      style={{
                        position: "fixed",
                        left: position?.left ?? -10000,
                        top: position?.top ?? -10000,
                        minWidth: POPOVER_MIN_W,
                        width: "min(320px, calc(100vw - 24px))",
                        maxWidth: "min(320px, calc(100vw - 24px))",
                        padding: "10px 12px",
                        animation: "footerTooltipIn 140ms ease-out both",
                      }}
                    >
                      {/* Caret: points toward the icon */}
                      <span
                        className="absolute h-0 w-0 border-[6px] border-transparent"
                        aria-hidden
                        style={
                          placement.v === "below"
                            ? {
                                ...(placement.h === "right"
                                  ? { left: 10 }
                                  : { right: 10, left: "auto" }),
                                top: 0,
                                transform: "translateY(-100%)",
                                borderBottomColor: "white",
                                borderLeftColor: "transparent",
                                borderRightColor: "transparent",
                                filter: "drop-shadow(0 -1px 0 rgb(226 232 240))",
                              }
                            : {
                                ...(placement.h === "right"
                                  ? { left: 10 }
                                  : { right: 10, left: "auto" }),
                                bottom: 0,
                                top: "auto",
                                transform: "translateY(100%)",
                                borderTopColor: "white",
                                borderLeftColor: "transparent",
                                borderRightColor: "transparent",
                                filter: "drop-shadow(0 1px 0 rgb(226 232 240))",
                              }
                        }
                      />
                      <p
                        className="relative text-sm leading-relaxed text-slate-600"
                        style={{
                          writingMode: "horizontal-tb",
                          whiteSpace: "normal",
                          wordBreak: "normal",
                          overflowWrap: "anywhere",
                          hyphens: "auto",
                        }}
                      >
                        {POPOVER_CONTENT}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Politikalar; masaüstünde 3. sütun */}
          <div className="min-w-0 md:order-3">
            <h3 className="text-sm font-semibold tracking-wide text-slate-900">
              Politikalar
            </h3>
            <div className="mt-3 h-px w-8 bg-slate-200" aria-hidden />
            <div className="mt-4 grid min-w-0 grid-cols-1 gap-y-2 md:grid-cols-2 md:gap-x-10 md:gap-y-2">
              <ul className="flex min-w-0 flex-col gap-y-2">
                {POLITIKALAR_SOL.map((label) => (
                  <li key={label} className="min-w-0">
                    <span
                      className="pointer-events-none cursor-default block text-sm font-normal leading-6 text-slate-600 [overflow-wrap:anywhere] transition-colors hover:text-slate-900"
                      aria-hidden
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
              <ul className="flex min-w-0 flex-col gap-y-2">
                {POLITIKALAR_SAG.map((label) => (
                  <li key={label} className="min-w-0">
                    <span
                      className="pointer-events-none cursor-default block text-sm font-normal leading-6 text-slate-600 [overflow-wrap:anywhere] transition-colors hover:text-slate-900"
                      aria-hidden
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Alt bar: divider + copyright */}
        <div className="mt-10 border-t border-slate-200/70 pt-5">
          <p className="text-xs text-slate-500">© 2026 İlanlar Cebimde</p>
        </div>
      </div>
    </footer>
  );
}
