import { normalizeTrCouponCode, YURTDISIIS_COUPON_CODE } from "@/lib/yurtdisiisCoupon";
import type { IndividualBillingPayload } from "@/lib/billingIndividual";
import { buildOdemeCheckoutPricing, type PaytrPendingShape } from "@/lib/odemePaytrPendingPricing";

const STORAGE_KEY = "billing_individual_odeme_v1";

export type StoredOdemeBilling = {
  fingerprint: string;
  individual_billing: IndividualBillingPayload;
};

const CV79 = "CV79";
const IYI = "İYİUSTALAR";

function couponKeyFromPending(parsed: PaytrPendingShape): string {
  const isWeekly = parsed.plan === "weekly";
  const isCvPackage = parsed.plan === "cv_package";
  const useYurtdisiis = isCvPackage && !!parsed.yurtdisiis_discount;
  const useCv79 = isCvPackage && !!parsed.cv79_discount && !useYurtdisiis;
  const useIyiustalar = !isWeekly && !isCvPackage && !!parsed.iyiustalar_discount;
  if (useYurtdisiis) return normalizeTrCouponCode(YURTDISIIS_COUPON_CODE);
  if (useCv79) return CV79;
  if (useIyiustalar) return IYI;
  return "";
}

/** Ödeme sayfası oturumu + sepet için fatura formu oturum anahtarı */
export function getOdemeBillingFingerprint(parsed: PaytrPendingShape | null): string | null {
  if (!parsed) return null;
  const email = parsed.email?.trim();
  if (!email) return null;
  const pricing = buildOdemeCheckoutPricing(parsed);
  if (!pricing) return null;
  const ck = couponKeyFromPending(parsed);
  return `${email.toLowerCase()}|${pricing.serviceName}|${pricing.netAmount}|${ck}`;
}

export function readOdemeBillingFromSession(parsed: PaytrPendingShape | null): IndividualBillingPayload | null {
  if (typeof window === "undefined") return null;
  const fp = getOdemeBillingFingerprint(parsed);
  if (!fp) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as StoredOdemeBilling;
    if (!obj || obj.fingerprint !== fp || !obj.individual_billing) return null;
    return obj.individual_billing;
  } catch {
    return null;
  }
}

export function writeOdemeBillingToSession(parsed: PaytrPendingShape | null, individual_billing: IndividualBillingPayload): void {
  if (typeof window === "undefined") return;
  const fp = getOdemeBillingFingerprint(parsed);
  if (!fp) return;
  const payload: StoredOdemeBilling = { fingerprint: fp, individual_billing };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearOdemeBillingSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
