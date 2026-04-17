/**
 * Google OAuth `redirectTo` kök adresi.
 * Vercel’de `NEXT_PUBLIC_SITE_URL=https://www.ilanlarcebimde.com` verin; Supabase Redirect URLs’e
 * aynı kök + `/auth/callback` ekleyin. Site URL localhost kalırsa hatalı akışta localhost’a düşebilir.
 */
export function getOAuthRedirectOrigin(): string {
  if (typeof window === "undefined") return "";
  const env = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (env) return env;
  return window.location.origin;
}
