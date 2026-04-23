/**
 * Open Graph / sosyal paylaşım meta URL yardımcıları.
 * Tüm og:image URL'leri absolute olmalı; platformlar relative URL'leri bazen çekemez.
 * Kapak görseli: kalıcı public URL olmalı; signed URL kullanılmamalı (süre bitince botlar çekemez).
 */

export const SITE_ORIGIN = "https://www.ilanlarcebimde.com";

/**
 * Sosyal paylaşım varsayılan görseli (500×500, public Supabase; WhatsApp/LinkedIn/Twitter/FB).
 * Blog veya `cover_image` olan sayfalarda `absoluteOgImageUrl` ile override edilir.
 */
export const DEFAULT_OG_IMAGE =
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/ilanlar%20cebimde%20logo3.png";

export const DEFAULT_OG_IMAGE_SIZE = { width: 500, height: 500 } as const;

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
