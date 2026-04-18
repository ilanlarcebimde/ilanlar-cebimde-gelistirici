/**
 * Ödeme sayfası paytr_pending oturumu → sepet adı ve tutarlar.
 * Tutarlar src/app/odeme/page.tsx ile senkron tutulmalıdır.
 */
import { AMOUNT_YURTDISIIS_DISCOUNTED, YURTDISIIS_DISCOUNT_AMOUNT } from "@/lib/yurtdisiisCoupon";
import { LETTER_PANEL_AMOUNT_TRY, LETTER_PANEL_BASKET } from "@/lib/letterPanelUnlock";

const AMOUNT_FULL = 549;
const AMOUNT_WEEKLY = 89;
const AMOUNT_CV_PACKAGE = 469;
const AMOUNT_CV_PACKAGE_DISCOUNTED = 390;
const AMOUNT_FULL_IYIUSTALAR = 420;
const IYIUSTALAR_DISCOUNT_AMOUNT = 129;
const CV79_DISCOUNT_AMOUNT = 79;

export const ODEME_BASKET_FULL = "Usta Başvuru Paketi";
export const ODEME_BASKET_WEEKLY = "Haftalık Premium";
export const ODEME_BASKET_CV_PACKAGE = "Yurtdışı CV Paketi";

export type PaytrPendingShape = {
  email?: string;
  plan?: string;
  cv79_discount?: boolean;
  yurtdisiis_discount?: boolean;
  iyiustalar_discount?: boolean;
};

export type OdemeCheckoutPricing = {
  serviceName: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  couponCode: string | null;
};

export function buildOdemeCheckoutPricing(parsed: PaytrPendingShape | null): OdemeCheckoutPricing | null {
  if (!parsed) return null;
  const isWeekly = parsed.plan === "weekly";
  const isCvPackage = parsed.plan === "cv_package";
  const useYurtdisiis = isCvPackage && !!parsed.yurtdisiis_discount;
  const useCv79 = isCvPackage && !!parsed.cv79_discount && !useYurtdisiis;
  const useIyiustalar = !isWeekly && !isCvPackage && !!parsed.iyiustalar_discount;

  if (isWeekly) {
    return {
      serviceName: ODEME_BASKET_WEEKLY,
      grossAmount: AMOUNT_WEEKLY,
      discountAmount: 0,
      netAmount: AMOUNT_WEEKLY,
      couponCode: null,
    };
  }
  if (isCvPackage) {
    if (useYurtdisiis) {
      return {
        serviceName: ODEME_BASKET_CV_PACKAGE,
        grossAmount: AMOUNT_CV_PACKAGE,
        discountAmount: YURTDISIIS_DISCOUNT_AMOUNT,
        netAmount: AMOUNT_YURTDISIIS_DISCOUNTED,
        couponCode: "YURTDİSİNDAİS",
      };
    }
    if (useCv79) {
      return {
        serviceName: ODEME_BASKET_CV_PACKAGE,
        grossAmount: AMOUNT_CV_PACKAGE,
        discountAmount: CV79_DISCOUNT_AMOUNT,
        netAmount: AMOUNT_CV_PACKAGE_DISCOUNTED,
        couponCode: "CV79",
      };
    }
    return {
      serviceName: ODEME_BASKET_CV_PACKAGE,
      grossAmount: AMOUNT_CV_PACKAGE,
      discountAmount: 0,
      netAmount: AMOUNT_CV_PACKAGE,
      couponCode: null,
    };
  }
  if (useIyiustalar) {
    return {
      serviceName: ODEME_BASKET_FULL,
      grossAmount: AMOUNT_FULL,
      discountAmount: IYIUSTALAR_DISCOUNT_AMOUNT,
      netAmount: AMOUNT_FULL_IYIUSTALAR,
      couponCode: "İYİUSTALAR",
    };
  }
  return {
    serviceName: ODEME_BASKET_FULL,
    grossAmount: AMOUNT_FULL,
    discountAmount: 0,
    netAmount: AMOUNT_FULL,
    couponCode: null,
  };
}

/** ADMIN549 ücretsiz tam paket — ödeme yok, fatura satırı tutarları */
export function buildAdmin549FreePricing(): OdemeCheckoutPricing {
  return {
    serviceName: ODEME_BASKET_FULL,
    grossAmount: AMOUNT_FULL,
    discountAmount: AMOUNT_FULL,
    netAmount: 0,
    couponCode: "ADMIN549",
  };
}

export function buildLetterPanelCheckoutPricing(): OdemeCheckoutPricing {
  return {
    serviceName: LETTER_PANEL_BASKET,
    grossAmount: LETTER_PANEL_AMOUNT_TRY,
    discountAmount: 0,
    netAmount: LETTER_PANEL_AMOUNT_TRY,
    couponCode: null,
  };
}

/** Haftalık premium kupon satırı (ödeme yok; arşiv tutarı). */
export function buildPremiumCouponArchivePricing(couponCode: string): OdemeCheckoutPricing {
  return {
    serviceName: ODEME_BASKET_WEEKLY,
    grossAmount: AMOUNT_WEEKLY,
    discountAmount: AMOUNT_WEEKLY,
    netAmount: 0,
    couponCode,
  };
}

/** `/api/paytr/initiate` ile aynı `payment_type` eşlemesi */
export function getPaymentTypeFromPending(parsed: PaytrPendingShape | null): string {
  if (!parsed) return "standard";
  const isWeekly = parsed.plan === "weekly";
  const isCvPackage = parsed.plan === "cv_package";
  const useYurtdisiis = isCvPackage && !!parsed.yurtdisiis_discount;
  const useCv79 = isCvPackage && !!parsed.cv79_discount && !useYurtdisiis;
  const useIyiustalar = !isWeekly && !isCvPackage && !!parsed.iyiustalar_discount;
  if (isWeekly) return "weekly";
  if (useCv79 || useYurtdisiis || useIyiustalar) return "discounted";
  return "standard";
}
