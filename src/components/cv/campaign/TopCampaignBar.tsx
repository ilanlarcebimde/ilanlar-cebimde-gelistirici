"use client";

import { useCvCampaign } from "./CvCampaignContext";

const BAR_TEXT =
  "⚡ Sınırlı kontenjan • CV paketi alanlara ülke ve mesleğe uygun iş ilanları sunulacaktır • 31.03.2026";

export function TopCampaignBar() {
  const { openFromBar } = useCvCampaign();

  return (
    <div className="fixed left-0 right-0 top-0 z-[1100] h-10 md:h-11">
      <button
        type="button"
        onClick={openFromBar}
        className="cv-campaign-bar-shimmer flex h-full w-full items-center justify-center overflow-hidden border-b border-red-900/25 px-2 text-center text-[11px] font-semibold leading-tight text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_4px_24px_rgba(185,28,28,0.35)] sm:text-xs md:text-[13px]"
        style={{
          background: "linear-gradient(105deg, #7f1d1d 0%, #b91c1c 22%, #ef4444 50%, #b91c1c 78%, #7f1d1d 100%)",
        }}
      >
        <span className="max-w-[100vw] truncate sm:whitespace-normal sm:px-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
          {BAR_TEXT}
        </span>
      </button>
    </div>
  );
}
