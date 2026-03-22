/**
 * Yurtdışı CV Paketi — kampanya kuponu (ödeme adımı).
 * Kod: kullanıcı mesajındaki biçim (Türkçe büyük harf normalizasyonu ile eşleşir).
 */
export const YURTDISIIS_COUPON_CODE = "YURTDİSİNDAİS";
export const YURTDISIIS_DISCOUNT_AMOUNT = 129;
/** Yurtdışı CV paketi liste fiyatı (kupon öncesi) — ödeme sayfası ile uyumlu */
export const CV_PACKAGE_BASE_PRICE = 469;
export const AMOUNT_YURTDISIIS_DISCOUNTED = CV_PACKAGE_BASE_PRICE - YURTDISIIS_DISCOUNT_AMOUNT;

/** 31.03.2026 son gün (Türkiye saati) */
const EXPIRY_INSTANT = new Date("2026-04-01T00:00:00+03:00");

export function normalizeTrCouponCode(raw: string): string {
  return raw.trim().normalize("NFC").toLocaleUpperCase("tr-TR");
}

export function isYurtdisiisCouponCode(input: string): boolean {
  return normalizeTrCouponCode(input) === normalizeTrCouponCode(YURTDISIIS_COUPON_CODE);
}

/** Kupon süresi dolmuş mu? (true = artık geçersiz) */
export function isYurtdisiisCouponExpired(now: Date = new Date()): boolean {
  return now >= EXPIRY_INSTANT;
}
