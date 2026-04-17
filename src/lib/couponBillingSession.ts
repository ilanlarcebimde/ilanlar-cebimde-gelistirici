import type { IndividualBillingPayload } from "@/lib/billingIndividual";
import { LETTER_PANEL_AMOUNT_TRY, LETTER_PANEL_BASKET } from "@/lib/letterPanelUnlock";

const KEY_FREE = "billing_individual_free549_v1";
const KEY_PREM = "billing_individual_premium_coupon_v1";
const KEY_LETTER = "billing_individual_letter_v1";

type Stored = { fingerprint: string; individual_billing: IndividualBillingPayload };

function readKey(key: string, fingerprint: string): IndividualBillingPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const o = JSON.parse(raw) as Stored;
    if (!o?.fingerprint || o.fingerprint !== fingerprint || !o.individual_billing) return null;
    return o.individual_billing;
  } catch {
    return null;
  }
}

function writeKey(key: string, fingerprint: string, individual_billing: IndividualBillingPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify({ fingerprint, individual_billing }));
}

export function fingerprintFree549(userId: string | null): string {
  return `ADMIN549|${userId ?? "anon"}`;
}

export function readFree549Billing(userId: string | null): IndividualBillingPayload | null {
  return readKey(KEY_FREE, fingerprintFree549(userId));
}

export function writeFree549Billing(userId: string | null, individual_billing: IndividualBillingPayload) {
  writeKey(KEY_FREE, fingerprintFree549(userId), individual_billing);
}

export function fingerprintPremiumCoupon(userId: string, codeUpper: string): string {
  return `${userId}|${codeUpper}`;
}

export function readPremiumCouponBilling(userId: string, codeUpper: string): IndividualBillingPayload | null {
  return readKey(KEY_PREM, fingerprintPremiumCoupon(userId, codeUpper));
}

export function writePremiumCouponBilling(userId: string, codeUpper: string, individual_billing: IndividualBillingPayload) {
  writeKey(KEY_PREM, fingerprintPremiumCoupon(userId, codeUpper), individual_billing);
}

export function fingerprintLetterPanel(userId: string): string {
  return `${userId}|${LETTER_PANEL_BASKET}|${LETTER_PANEL_AMOUNT_TRY}`;
}

export function readLetterPanelBilling(userId: string): IndividualBillingPayload | null {
  return readKey(KEY_LETTER, fingerprintLetterPanel(userId));
}

export function writeLetterPanelBilling(userId: string, individual_billing: IndividualBillingPayload) {
  writeKey(KEY_LETTER, fingerprintLetterPanel(userId), individual_billing);
}
