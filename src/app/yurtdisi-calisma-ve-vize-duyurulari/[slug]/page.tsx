import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabasePublic } from "@/lib/supabase/server";
import { SITE_ORIGIN } from "@/lib/og";

function nowIso() {
  return new Date().toISOString();
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabasePublic();
  const { data: post } = await supabase
    .from("merkezi_posts")
    .select("title, summary, seo_title, og_title, og_description, og_image, canonical_url")
    .eq("slug", slug)
    .eq("content_type", "international_work_visa_news")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${nowIso()}`)
    .maybeSingle();

  if (!post) return { title: "Bulunamadi | Ilanlar Cebimde" };

  const title = (post as { seo_title?: string | null; title?: string }).seo_title || (post as { title: string }).title;
  const description = (post as { summary?: string | null; og_description?: string | null }).og_description || (post as { summary?: string | null }).summary || "";
  const canonical = (post as { canonical_url?: string | null }).canonical_url || `${SITE_ORIGIN}/yurtdisi-calisma-ve-vize-duyurulari/${slug}`;
  const ogTitle = (post as { og_title?: string | null }).og_title || title;
  const ogImage = (post as { og_image?: string | null }).og_image || undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      type: "article",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function InternationalNewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getSupabasePublic();

  const { data: post } = await supabase
    .from("merkezi_posts")
    .select(
      "id, title, summary, content_html_sanitized, country_slug, city, news_type, source_name, source_url, effective_date, priority_level, news_badge, structured_summary, user_impact, application_impact, published_at"
    )
    .eq("slug", slug)
    .eq("content_type", "international_work_visa_news")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${nowIso()}`)
    .maybeSingle();

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-3xl space-y-5 px-4">
        <Link href="/yurtdisi-calisma-ve-vize-duyurulari" className="text-sm text-slate-600 hover:text-slate-900">
          ← Duyurulara don
        </Link>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{(post as { priority_level?: string | null }).priority_level || "normal"}</span>
            {(post as { news_badge?: string | null }).news_badge ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">{(post as { news_badge: string }).news_badge}</span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{(post as { title: string }).title}</h1>
          {(post as { summary?: string | null }).summary ? (
            <p className="mt-2 text-sm text-slate-600">{(post as { summary: string }).summary}</p>
          ) : null}

          <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 md:grid-cols-2">
            <p><strong>Ulke:</strong> {(post as { country_slug?: string | null }).country_slug || "-"}</p>
            <p><strong>Sehir:</strong> {(post as { city?: string | null }).city || "-"}</p>
            <p><strong>Duyuru turu:</strong> {(post as { news_type?: string | null }).news_type || "-"}</p>
            <p><strong>Gecerlilik tarihi:</strong> {(post as { effective_date?: string | null }).effective_date || "-"}</p>
            <p className="md:col-span-2"><strong>Kaynak kurum:</strong> {(post as { source_name?: string | null }).source_name || "-"}</p>
            {(post as { source_url?: string | null }).source_url ? (
              <p className="md:col-span-2">
                <strong>Kaynak link:</strong>{" "}
                <a href={(post as { source_url: string }).source_url} target="_blank" rel="noreferrer" className="text-sky-700 underline">
                  {(post as { source_url: string }).source_url}
                </a>
              </p>
            ) : null}
          </div>

          {(post as { structured_summary?: string | null }).structured_summary ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Resmi Kaynak Ozeti</p>
              <p className="mt-1">{(post as { structured_summary: string }).structured_summary}</p>
            </div>
          ) : null}

          {(post as { user_impact?: string | null }).user_impact ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Kullaniciya Etkisi</p>
              <p className="mt-1">{(post as { user_impact: string }).user_impact}</p>
            </div>
          ) : null}

          {(post as { application_impact?: string | null }).application_impact ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Basvuru Surecine Etkisi</p>
              <p className="mt-1">{(post as { application_impact: string }).application_impact}</p>
            </div>
          ) : null}

          {(post as { content_html_sanitized?: string | null }).content_html_sanitized ? (
            <div
              className="prose prose-slate mt-6 max-w-none prose-headings:mt-6 prose-p:leading-7"
              dangerouslySetInnerHTML={{ __html: (post as { content_html_sanitized: string }).content_html_sanitized }}
            />
          ) : null}
        </article>
      </div>
    </div>
  );
}
