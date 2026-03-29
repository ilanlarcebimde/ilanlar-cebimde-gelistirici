/**
 * Geçici önizleme: belirli e-posta için süre dolana kadar premium UX + bakım pop-up yok.
 * Ödeme (PayTR) kapalı kalır; süre bitince normal kurallar geçerli.
 * Bitiş: 29 Mart 2026 + 7 gün (Türkiye saati).
 * Süreyi uzatmak için `VIP_PREVIEW_UNTIL_MS` ve gerekirse bu yorumu güncelleyin.
 */
export const VIP_PREVIEW_EMAIL = "hayalet3416@gmail.com";

/** 5 Nisan 2026 23:59:59 Türkiye (UTC+3) */
export const VIP_PREVIEW_UNTIL_MS = new Date("2026-04-05T23:59:59+03:00").getTime();

export function isVipPreviewEmail(email: string | null | undefined): boolean {
  return (email?.trim().toLowerCase() ?? "") === VIP_PREVIEW_EMAIL;
}

export function isVipPreviewActiveAt(nowMs: number, email: string | null | undefined): boolean {
  if (!isVipPreviewEmail(email)) return false;
  return nowMs < VIP_PREVIEW_UNTIL_MS;
}

export function isVipPreviewActive(email: string | null | undefined): boolean {
  return isVipPreviewActiveAt(Date.now(), email);
}

/** useSubscriptionActive / panel için sahte abonelik satırı (bitiş = VIP_PREVIEW_UNTIL_MS). */
export function getVipPreviewSubscriptionDetail(): {
  ends_at: string;
  payment_type: string;
  coupon_code: null;
} {
  return {
    ends_at: new Date(VIP_PREVIEW_UNTIL_MS).toISOString(),
    payment_type: "vip_preview",
    coupon_code: null,
  };
}
