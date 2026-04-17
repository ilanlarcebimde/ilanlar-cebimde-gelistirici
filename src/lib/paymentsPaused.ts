/**
 * Varsayılan: ödemeler açık. Bakım / geçici kapatma için ortam değişkeni kullanın.
 * `NEXT_PUBLIC_PAYMENTS_PAUSED=true` veya `1` iken PayTR başlatma ve ilgili UI durur (`/api/paytr/initiate` dahil).
 */
const raw = process.env.NEXT_PUBLIC_PAYMENTS_PAUSED?.trim().toLowerCase() ?? "";
export const PAYMENTS_PAUSED = raw === "true" || raw === "1" || raw === "yes";
