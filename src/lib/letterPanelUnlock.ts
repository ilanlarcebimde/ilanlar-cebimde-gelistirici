import { createHmac, timingSafeEqual } from "crypto";

/** PayTR `payments.payment_type` — haftalık premium ile karışmaz */
export const LETTER_PANEL_PAYMENT_TYPE = "letter_panel_unlock" as const;

export const LETTER_PANEL_AMOUNT_TRY = 79;

export const LETTER_PANEL_BASKET = "İş Başvuru Mektubu Paneli Erişimi";

export const LETTER_PANEL_COOKIE_NAME = "letter_panel_unlock_v1";

const MAX_AGE_SEC = 365 * 24 * 60 * 60;

function getCookieSecret(): string {
  const s = process.env.LETTER_PANEL_COOKIE_SECRET?.trim();
  if (s) return s;
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (fallback) return fallback;
  return "letter-panel-dev-only";
}

/** Şifre ile unlock sonrası httpOnly cookie değeri */
export function createLetterPanelCookieValue(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = JSON.stringify({ uid: userId, exp });
  const secret = getCookieSecret();
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifyLetterPanelCookieValue(token: string | undefined, userId: string): boolean {
  if (!token || !userId) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const secret = getCookieSecret();
  const expectedSig = createHmac("sha256", secret).update(payload).digest("base64url");
  if (expectedSig.length !== sig.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))) return false;
  } catch {
    return false;
  }
  let obj: { uid?: string; exp?: number };
  try {
    obj = JSON.parse(payload) as { uid?: string; exp?: number };
  } catch {
    return false;
  }
  if (obj.uid !== userId) return false;
  if (!obj.exp || obj.exp < Math.floor(Date.now() / 1000)) return false;
  return true;
}

export { MAX_AGE_SEC as LETTER_PANEL_COOKIE_MAX_AGE_SEC };
