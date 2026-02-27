import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";

function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!url) return "https://www.ilanlarcebimde.com";
  return url.replace(/\/$/, "");
}

/** Google Search Console uyumlu, güncellenebilir sitemap. Her istekte base URL + statik sayfalar + DB'deki kanal slug'ları ile üretilir. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/hakkimizda`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/iletisim`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/sss`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/yurtdisi-is-ilanlari`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/ucretsiz-yurtdisi-is-ilanlari`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/yurtdisi-cv-paketi`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/premium/job-guides`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${base}/giris`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Yasal sayfalar
    {
      url: `${base}/gizlilik-politikasi`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/cerez-politikasi`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/mesafeli-satis-sozlesmesi`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/musteri-hizmetleri-politikasi`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/sorumluluk-reddi-beyani`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/uluslararasi-yasal-uyum`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/alisveris-guvenligi`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/iade-ve-geri-odeme`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/hizmet-sozlesmesi`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${base}/kullanim-kosullari`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  let channelUrls: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data: channels } = await supabase
      .from("channels")
      .select("slug")
      .eq("is_active", true)
      .order("slug");
    if (channels?.length) {
      channelUrls = channels.map((c) => ({
        url: `${base}/kanal/${encodeURIComponent((c as { slug: string }).slug)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Supabase yoksa veya RLS/table yoksa sadece statik sitemap
  }

  return [...staticRoutes, ...channelUrls];
}
