/**
 * Open Graph / sosyal paylaşım meta URL yardımcıları.
 * Tüm og:image URL'leri absolute olmalı; platformlar relative URL'leri bazen çekemez.
 */

export const SITE_ORIGIN = "https://www.ilanlarcebimde.com";

/** Liste sayfası ve kapak görseli olmayan sayfalar için varsayılan OG görseli (absolute). */
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/logo.png`;

/**
 * Relative veya absolute bir görsel URL'ini sosyal paylaşım için absolute URL'e çevirir.
 * Eğer url boş/geçersizse fallback döner.
 */
export function absoluteOgImageUrl(
  url: string | null | undefined,
  fallback: string = DEFAULT_OG_IMAGE
): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed.startsWith("/") ? `${SITE_ORIGIN}${trimmed}` : `${SITE_ORIGIN}/${trimmed}`;
}
