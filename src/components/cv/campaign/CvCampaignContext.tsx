"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CV_CAMPAIGN_BAR_HEIGHT_PX,
  CV_CAMPAIGN_BAR_ROOT_ID,
  CV_CAMPAIGN_POPUP_DISMISSED_KEY,
} from "./cvCampaignConstants";

type CvCampaignContextValue = {
  popupOpen: boolean;
  /** Otomatik veya şeritten açılış; kapatınca localStorage ile bir daha otomatik gösterilmez */
  closePopup: () => void;
  /** Üst şerit: forma kaydır + popup'ı tekrar göster */
  openFromBar: () => void;
  /** Sihirbaz: ilk adımdan çıkıldığında (timer ile yarışır, ilki tetikler) */
  notifyLeaveFirstStep: () => void;
  /** CTA: forma kaydır, popup'ı kapat */
  advanceWithAdvantage: () => void;
  /** Ana içerik alt boşluğu (popup sabit iken içerik sıkışmasın) */
  mainBottomPadding: boolean;
};

const CvCampaignContext = createContext<CvCampaignContextValue | null>(null);

function getCampaignBarHeightPx(): number {
  if (typeof document === "undefined") return CV_CAMPAIGN_BAR_HEIGHT_PX;
  const el = document.getElementById(CV_CAMPAIGN_BAR_ROOT_ID);
  return el?.offsetHeight ?? CV_CAMPAIGN_BAR_HEIGHT_PX;
}

function scrollToCvAnchor() {
  if (typeof window === "undefined") return;
  const payment = document.getElementById("cv-package-payment");
  const target = payment ?? document.getElementById("cv-wizard-start");
  if (!target) return;
  const headerApprox = 56;
  const offset = headerApprox + getCampaignBarHeightPx() + 8;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function CvCampaignProvider({
  children,
  /** false: alt kampanya popup’ı ve otomatik zamanlayıcı kapalı (Yurtdışı CV Paketi sayfası). */
  campaignPopupEnabled = true,
}: {
  children: React.ReactNode;
  campaignPopupEnabled?: boolean;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const hasAutoShownRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDismissed = useCallback(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CV_CAMPAIGN_POPUP_DISMISSED_KEY) === "1";
  }, []);

  const tryShowAuto = useCallback(() => {
    if (!campaignPopupEnabled) return;
    if (isDismissed()) return;
    if (hasAutoShownRef.current) return;
    hasAutoShownRef.current = true;
    setPopupOpen(true);
  }, [campaignPopupEnabled, isDismissed]);

  useEffect(() => {
    if (!campaignPopupEnabled) return;
    if (typeof window === "undefined") return;
    if (isDismissed()) return;
    const delayMs = 5000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => tryShowAuto(), delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [campaignPopupEnabled, isDismissed, tryShowAuto]);

  const closePopup = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CV_CAMPAIGN_POPUP_DISMISSED_KEY, "1");
    }
    setPopupOpen(false);
  }, []);

  const openFromBar = useCallback(() => {
    scrollToCvAnchor();
    if (campaignPopupEnabled) setPopupOpen(true);
  }, [campaignPopupEnabled]);

  const notifyLeaveFirstStep = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    tryShowAuto();
  }, [tryShowAuto]);

  const advanceWithAdvantage = useCallback(() => {
    scrollToCvAnchor();
    setPopupOpen(false);
  }, []);

  const value = useMemo<CvCampaignContextValue>(
    () => ({
      popupOpen: campaignPopupEnabled && popupOpen,
      closePopup,
      openFromBar,
      notifyLeaveFirstStep,
      advanceWithAdvantage,
      mainBottomPadding: campaignPopupEnabled && popupOpen,
    }),
    [campaignPopupEnabled, popupOpen, closePopup, openFromBar, notifyLeaveFirstStep, advanceWithAdvantage]
  );

  return <CvCampaignContext.Provider value={value}>{children}</CvCampaignContext.Provider>;
}

export function useCvCampaign() {
  const ctx = useContext(CvCampaignContext);
  if (!ctx) {
    throw new Error("useCvCampaign must be used within CvCampaignProvider");
  }
  return ctx;
}
