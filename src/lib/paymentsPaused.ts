/**
 * Tüm PayTR ödeme başlatmalarını kapatır (`/api/paytr/initiate` dahil).
 * Yeniden açmak için Vercel’de `NEXT_PUBLIC_PAYMENTS_PAUSED=false` ayarlayıp yeniden deploy edin.
 */
export const PAYMENTS_PAUSED = process.env.NEXT_PUBLIC_PAYMENTS_PAUSED !== "false";
