"use client";

import { useEffect, useState } from "react";
import { useCvCampaign } from "./CvCampaignContext";
import { CV_CAMPAIGN_BAR_HEIGHT_PX, CV_CAMPAIGN_BAR_ROOT_ID } from "./cvCampaignConstants";

const LINE_PRIMARY = "⚡ Sınırlı kontenjanlı kampanya";
const LINE_SECONDARY =
  "CV paketi alanlara seçilen ülke ve mesleğe uygun ilanlar sunulur • 31.03.2026'ya kadar";

/**
 * Şerit yüksekliğini ölçer, `--cv-campaign-bar-height` ve scroll ofseti için state üretir.
 * TopCampaignBar ile aynı sayfada kullanılmalıdır.
 */
export function useCvCampaignBarHeightSync(): number {
  const [heightPx, setHeightPx] = useState(CV_CAMPAIGN_BAR_HEIGHT_PX);

  useEffect(() => {
    const el = document.getElementById(CV_CAMPAIGN_BAR_ROOT_ID);
    if (!el) return;

    const sync = () => {
      const h = el.offsetHeight;
      setHeightPx(h);
      document.documentElement.style.setProperty("--cv-campaign-bar-height", `${h}px`);
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);

    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--cv-campaign-bar-height");
    };
  }, []);

  return heightPx;
}

export function TopCampaignBar() {
  const { openFromBar } = useCvCampaign();

  return (
    <div id={CV_CAMPAIGN_BAR_ROOT_ID} className="fixed left-0 right-0 top-0 z-[1100]">
      <button
        type="button"
        onClick={openFromBar}
        className="cv-campaign-bar-shimmer flex w-full flex-col items-center justify-center gap-1.5 border-b border-red-950/30 px-3 py-2.5 text-center shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_6px_28px_rgba(127,29,29,0.45)] sm:gap-1 sm:px-5 sm:py-3"
        style={{
          background: "linear-gradient(105deg, #7f1d1d 0%, #b91c1c 22%, #ef4444 50%, #b91c1c 78%, #7f1d1d 100%)",
        }}
      >
        <span className="w-full max-w-2xl text-[13px] font-bold leading-snug tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] sm:text-sm">
          {LINE_PRIMARY}
        </span>
        <span className="w-full max-w-2xl text-[11px] font-medium leading-snug text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] sm:text-xs sm:leading-relaxed">
          {LINE_SECONDARY}
        </span>
      </button>
    </div>
  );
}
