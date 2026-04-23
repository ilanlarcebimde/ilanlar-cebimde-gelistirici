import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** ISR: sayfayı her saat bir kez yenile; Vercel serverless timeout riskini ortadan kaldırır. */
export const revalidate = 3600;

function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!url) return "https://www.ilanlarcebimde.com";
  return url.replace(/\/$/, "");
}

/** Belirtilen ms içinde resolve olmazsa null döner. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timer = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  return Promise.race([promise, timer]);
}

/** Google Search Console uyumlu, ISR destekli sitemap. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/hakkimizda`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/iletisim`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/sss`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/yurtdisi-is-ilanlari`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ucretsiz-yurtdisi-is-ilanlari`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ilanlar`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/yurtdisi-is-basvuru-merkezi`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/yurtdisi-is-basvuru-danismanligi`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/is-basvuru-mektubu-olustur`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/yurtdisi-calisma-ve-vize-duyurulari`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/ucretsiz-vize-danismanligi`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/yurtdisi-cv-paketi`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/premium/job-guides`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/giris`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    // Yasal sayfalar
    { url: `${base}/gizlilik-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/cerez-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/mesafeli-satis-sozlesmesi`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/musteri-hizmetleri-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/sorumluluk-reddi-beyani`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/uluslararasi-yasal-uyum`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/alisveris-guvenligi`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/iade-ve-geri-odeme`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/hizmet-sozlesmesi`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/kullanim-kosullari`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  let channelUrls: MetadataRoute.Sitemap = [];
  let merkeziUrls: MetadataRoute.Sitemap = [];
  const merkeziBase = "/yurtdisi-is-ilanlari";
  const newsBase = "/yurtdisi-calisma-ve-vize-duyurulari";

  try {
    const supabase = getSupabaseAdmin();

    const result = await withTimeout(
      Promise.all([
        supabase.from("channels").select("slug").eq("is_active", true).order("slug"),
        supabase
          .from("merkezi_posts")
          .select("slug, updated_at, published_at, content_type")
          .eq("status", "published")
          .or("published_at.is.null,published_at.lte." + new Date().toISOString())
          .order("published_at", { ascending: false }),
        supabase
          .from("merkezi_seo_pages")
          .select("type, sector_slug, country_slug, updated_at"),
      ]),
      8000 // 8 saniyede gelmezse boş dön; Vercel free tier 10s limit
    );

    if (!result) {
      console.error("[sitemap] Supabase queries timed out after 8s — returning static-only sitemap");
      return staticRoutes;
    }

    const [channelsRes, postsRes, seoRes] = result;

    if (channelsRes.error) console.error("[sitemap] channels query error:", channelsRes.error.message);
    if (postsRes.error) console.error("[sitemap] merkezi_posts query error:", postsRes.error.message);
    if (seoRes.error) console.error("[sitemap] merkezi_seo_pages query error:", seoRes.error.message);

    if (channelsRes.data?.length) {
      channelUrls = channelsRes.data.map((c) => ({
        url: `${base}/kanal/${encodeURIComponent((c as { slug: string }).slug)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }

    // Tüm URL'leri set'e topluyoruz; merkezi_posts + seo_pages çakışmaları düşürülür
    const seenUrls = new Set<string>();

    if (postsRes.data?.length) {
      for (const p of postsRes.data) {
        const row = p as {
          slug: string;
          updated_at?: string;
          published_at?: string;
          content_type?: "job" | "blog" | "international_work_visa_news" | null;
        };
        const postBase = row.content_type === "international_work_visa_news" ? newsBase : merkeziBase;
        const url = `${base}${postBase}/${encodeURIComponent(row.slug)}`;
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        const lastMod = row.updated_at || row.published_at || now.toISOString();
        merkeziUrls.push({
          url,
          lastModified: new Date(lastMod),
          changeFrequency: "weekly" as const,
          priority: 0.85,
        });
      }
    }

    if (seoRes.data?.length) {
      for (const row of seoRes.data as { type: string; sector_slug: string; country_slug?: string | null; updated_at?: string }[]) {
        const segment =
          row.type === "sector"
            ? row.sector_slug
            : row.type === "country_sector" && row.country_slug
              ? `${row.country_slug}-${row.sector_slug}`
              : null;
        if (!segment) continue;
        const url = `${base}${merkeziBase}/${encodeURIComponent(segment)}`;
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        merkeziUrls.push({
          url,
          lastModified: row.updated_at ? new Date(row.updated_at) : now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        });
      }
    }
  } catch (err) {
    console.error("[sitemap] Unexpected error building dynamic URLs:", err);
  }

  return [...staticRoutes, ...channelUrls, ...merkeziUrls];
}
