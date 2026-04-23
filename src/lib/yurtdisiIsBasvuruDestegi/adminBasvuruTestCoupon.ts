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
 * `next dev` (NODE_ENV=development): açık — ek env gerekmez.
 * `next start` / Vercel (production build): açık olması için
 * - **Asgari (hem API hem istemcide 0₺)**: `NEXT_PUBLIC_ALLOW_ADMIN_BASVURU_FREE_COUPON` (true/1) — Next sunucu route’u da aynı değişkeni okur.
 * - İsteğe bağlı yalnız sunucu: `ALLOW_ADMIN_BASVURU_FREE_COUPON` (yalnız public olmadan API’de yetki; istemcide 0₺ hâlâ public bayrak gerekir)
 */
export function isAdminBasvuruFreeUnlimitedCouponEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (envFlagOn(process.env.NEXT_PUBLIC_ALLOW_ADMIN_BASVURU_FREE_COUPON)) return true;
  if (envFlagOn(process.env.ALLOW_ADMIN_BASVURU_FREE_COUPON)) return true;
  return false;
}

/** Kupon metni + bu ortamda 0₺/PayTR atla yolunun açık olması. */
export function isAdminBasvuruFreeUnlimitedActive(raw: string): boolean {
  return isAdminBasvuruFreeUnlimitedCoupon(raw) && isAdminBasvuruFreeUnlimitedCouponEnabled();
}
