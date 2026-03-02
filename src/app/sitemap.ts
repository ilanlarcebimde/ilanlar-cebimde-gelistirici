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
      url: `${base}/yurtdisi-is-basvuru-merkezi`,
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
  let merkeziUrls: MetadataRoute.Sitemap = [];
  const merkeziBase = "/yurtdisi-is-ilanlari";

  try {
    const supabase = getSupabaseAdmin();
    const [channelsRes, postsRes, seoRes] = await Promise.all([
      supabase.from("channels").select("slug").eq("is_active", true).order("slug"),
      supabase
        .from("merkezi_posts")
        .select("slug, updated_at, published_at")
        .eq("status", "published")
        .or("published_at.is.null,published_at.lte." + new Date().toISOString())
        .order("published_at", { ascending: false }),
      supabase
        .from("merkezi_seo_pages")
        .select("type, sector_slug, country_slug, updated_at"),
    ]);

    if (channelsRes.data?.length) {
      channelUrls = channelsRes.data.map((c) => ({
        url: `${base}/kanal/${encodeURIComponent((c as { slug: string }).slug)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }

    if (postsRes.data?.length) {
      merkeziUrls = postsRes.data.map((p) => {
        const row = p as { slug: string; updated_at?: string; published_at?: string };
        const lastMod = row.updated_at || row.published_at || now.toISOString();
        return {
          url: `${base}${merkeziBase}/${encodeURIComponent(row.slug)}`,
          lastModified: new Date(lastMod),
          changeFrequency: "weekly" as const,
          priority: 0.85,
        };
      });
    }

    if (seoRes.data?.length) {
      for (const row of seoRes.data as { type: string; sector_slug: string; country_slug?: string | null; updated_at?: string }[]) {
        const segment =
          row.type === "sector"
            ? row.sector_slug
            : row.type === "country_sector" && row.country_slug
              ? `${row.country_slug}-${row.sector_slug}`
              : null;
        if (segment) {
          merkeziUrls.push({
            url: `${base}${merkeziBase}/${encodeURIComponent(segment)}`,
            lastModified: row.updated_at ? new Date(row.updated_at) : now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    // Supabase yoksa veya tablo yoksa sadece statik + channel sitemap
  }

  return [...staticRoutes, ...channelUrls, ...merkeziUrls];
}
