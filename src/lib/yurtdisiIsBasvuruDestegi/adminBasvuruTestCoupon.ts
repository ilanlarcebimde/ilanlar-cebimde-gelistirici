import { normalizeTrCouponCode } from "@/lib/yurtdisiisCoupon";

/** Sadece test / staging veya açıkça açıldığında production’da kullanılır. */
export const ADMIN_BASVURU_FREE_UNLIMITED_COUPON = "ADMIN_FREE_UNLIMITED";

export function isAdminBasvuruFreeUnlimitedCoupon(raw: string): boolean {
  if (!raw.trim()) return false;
  return normalizeTrCouponCode(raw) === normalizeTrCouponCode(ADMIN_BASVURU_FREE_UNLIMITED_COUPON);
}

export function isAdminBasvuruFreeUnlimitedCouponEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const v = (process.env.ALLOW_ADMIN_BASVURU_FREE_COUPON ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
