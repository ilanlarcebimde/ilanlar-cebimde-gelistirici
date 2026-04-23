import { normalizeTrCouponCode } from "@/lib/yurtdisiisCoupon";

/** Sadece test / staging veya açıkça açıldığında production’da kullanılır. */
export const ADMIN_BASVURU_FREE_UNLIMITED_COUPON = "ADMIN_FREE_UNLIMITED";

export function isAdminBasvuruFreeUnlimitedCoupon(raw: string): boolean {
  if (!raw.trim()) return false;
  return normalizeTrCouponCode(raw) === normalizeTrCouponCode(ADMIN_BASVURU_FREE_UNLIMITED_COUPON);
}

function envFlagOn(value: string | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Sunucu: `ALLOW_ADMIN_BASVURU_FREE_COUPON` veya (aynı değer genelde) `NEXT_PUBLIC_…`
 * Tarayıcı: sadece `NEXT_PUBLIC_…` build anında inline olur — production’da test kuponu
 * için en az bu değişkeni da ayarlayın, yoksa 0 tutar + PayTR reddi oluşur.
 */
export function isAdminBasvuruFreeUnlimitedCouponEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const allowServer = envFlagOn(process.env.ALLOW_ADMIN_BASVURU_FREE_COUPON);
  const allowPublic = envFlagOn(process.env.NEXT_PUBLIC_ALLOW_ADMIN_BASVURU_FREE_COUPON);
  return allowServer || allowPublic;
}

/** Kupon metni + bu ortamda 0₺/PayTR atla yolunun açık olması. */
export function isAdminBasvuruFreeUnlimitedActive(raw: string): boolean {
  return isAdminBasvuruFreeUnlimitedCoupon(raw) && isAdminBasvuruFreeUnlimitedCouponEnabled();
}
