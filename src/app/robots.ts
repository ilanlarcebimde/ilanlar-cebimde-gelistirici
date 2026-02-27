import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!url) return "https://www.ilanlarcebimde.com";
  return url.replace(/\/$/, "");
}

/** Google Search Console için robots.txt; sitemap adresi otomatik senkronize. */
export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/panel", "/aboneliklerim", "/odeme", "/admin"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
