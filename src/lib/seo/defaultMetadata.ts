import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_SIZE, SITE_ORIGIN } from "@/lib/og";

export const SEO_SITE_NAME = "İlanlar Cebimde";
export const DEFAULT_OG_LOCALE = "tr_TR" as const;

type BuildPageMetadataInput = {
  title: string;
  description: string;
  /**
   * Sayfa yolu, ör. "/hakkimizda" — `canonical` ve (isteğe bağlı) `openGraph.url` için kullanılır.
   */
  path: string;
  /** `alternates.canonical` ve (varsayılan) `openGraph.url` */
  canonicalUrl?: string;
  /**
   * Paylaşım önizlemesinde kullanılacak tam veya path-tabanlı URL; örn. filtreli liste için query içeren URL.
   * Verilmezse `canonicalUrl` (veya path’ten türetilen) kullanılır.
   */
  openGraphUrl?: string;
  /**
   * OG/Twitter görseli. Verilmezse site varsayılan logosu (500×500) kullanılır.
   * Blog / kapak özel URL’si bu parametreyle verilmelidir.
   */
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  openGraphType?: "website" | "article";
  robots?: Metadata["robots"];
} & Pick<Metadata, "keywords" | "verification">;

/**
 * Statik / landing sayfalar için tekil, production-ready `Metadata` üretir.
 * `openGraph` + `twitter` (summary_large_image) + `alternates.canonical` içerir.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  canonicalUrl: canonicalIn,
  openGraphUrl: ogUrlIn,
  imageUrl: imageIn,
  imageAlt,
  imageWidth,
  imageHeight,
  openGraphType = "website",
  robots,
  keywords,
  verification,
}: BuildPageMetadataInput): Metadata {
  const pathNorm = path.startsWith("/") ? path : `/${path}`;
  const canonical = canonicalIn ?? `${SITE_ORIGIN}${pathNorm}`;
  const openGraphPageUrl = ogUrlIn ?? canonical;
  const imageUrl = imageIn ?? DEFAULT_OG_IMAGE;
  const isDefaultSocialImage = imageUrl === DEFAULT_OG_IMAGE;
  const w =
    imageWidth ?? (isDefaultSocialImage ? DEFAULT_OG_IMAGE_SIZE.width : 1200);
  const h =
    imageHeight ?? (isDefaultSocialImage ? DEFAULT_OG_IMAGE_SIZE.height : 630);
  const alt = (imageAlt ?? title).trim() || SEO_SITE_NAME;

  return {
    title,
    description,
    keywords,
    verification,
    alternates: { canonical },
    robots,
    openGraph: {
      title,
      description,
      url: openGraphPageUrl,
      siteName: SEO_SITE_NAME,
      locale: DEFAULT_OG_LOCALE,
      type: openGraphType,
      images: [{ url: imageUrl, width: w, height: h, alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function buildCanonicalFromPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}
