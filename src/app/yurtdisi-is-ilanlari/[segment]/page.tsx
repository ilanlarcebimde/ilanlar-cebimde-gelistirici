import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveSegment, getTagsByPostIds } from "@/lib/merkezi/server";
import { absoluteOgImageUrl, SITE_ORIGIN } from "@/lib/og";
import { MerkeziListView } from "./MerkeziListView";
import Link from "next/link";
import {
  getLandingOrder,
  prepareMerkeziPostDetail,
} from "@/lib/merkezi/postNavigation";
import { MerkeziPostView } from "./MerkeziPostView";
import { PostNextNavigation } from "@/components/merkezi/PostNextNavigation";

const BASE = "/yurtdisi-is-ilanlari";
const BACK_HREF = "/yurtdisi-is-basvuru-merkezi";

/** Yazı detayı her istekte güncel (kapak, özet vb.) olsun. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ segment: string }>;
  searchParams: Promise<{ etiket?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  try {
    const { segment } = await params;
    const { etiket } = await searchParams;
    const seg = typeof segment === "string" ? segment : "";
    const resolved = seg ? await resolveSegment(seg) : null;
    if (!resolved) return { title: "Bulunamadı | İlanlar Cebimde" };
    const canonical = SITE_ORIGIN + BASE + "/" + seg;
    const robots = etiket ? { index: false, follow: true } : undefined;

    if (resolved.kind === "post") {
      const post = resolved.post;
      const title = (post?.title ?? "Yazı") + " | İlanlar Cebimde";
      const description = (post?.summary?.trim() || post?.title) ?? title;
      const slug = post?.slug ?? seg;
      const canonicalUrl = SITE_ORIGIN + BASE + "/" + slug;
      const coverUrl = absoluteOgImageUrl(post?.cover_image_url);
      return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        robots,
        openGraph: {
          title,
          description,
          type: "article",
          url: canonicalUrl,
          siteName: "İlanlar Cebimde",
          images: [{ url: coverUrl, width: 1200, height: 630, alt: post?.title ?? "İlanlar Cebimde" }],
          locale: "tr_TR",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [coverUrl],
        },
      };
    }

    if (resolved.kind === "sector") {
      const title = resolved.seoPage?.title ?? (resolved.sectorSlug ?? "Sektör") + " | İlanlar Cebimde";
      const ogImageUrl = absoluteOgImageUrl(resolved.seoPage?.cover_image_url);
      return {
        title,
        description: resolved.seoPage?.meta_description ?? undefined,
        alternates: { canonical },
        robots,
        openGraph: {
          title,
          description: resolved.seoPage?.meta_description ?? undefined,
          url: canonical,
          images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
        },
        twitter: { card: "summary_large_image", title, description: resolved.seoPage?.meta_description ?? undefined, images: [ogImageUrl] },
      };
    }

    const title =
      resolved.seoPage?.title ??
      (resolved.countrySlug ?? "Ülke") + " - " + (resolved.sectorSlug ?? "Sektör") + " | İlanlar Cebimde";
    const ogImageUrl = absoluteOgImageUrl(resolved.seoPage?.cover_image_url);
    return {
      title,
      description: resolved.seoPage?.meta_description ?? undefined,
      alternates: { canonical },
      robots,
      openGraph: {
        title,
        description: resolved.seoPage?.meta_description ?? undefined,
        url: canonical,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: { card: "summary_large_image", title, description: resolved.seoPage?.meta_description ?? undefined, images: [ogImageUrl] },
    };
  } catch (_e) {
    return { title: "İlanlar Cebimde", description: "Yurtdışı iş ilanları ve başvuru rehberleri." };
  }
}

export default async function SegmentPage({ params, searchParams }: PageProps) {
  try {
    const { segment } = await params;
    const { etiket } = await searchParams;

    const resolved = await resolveSegment(segment);
    if (!resolved) notFound();

    if (resolved.kind === "post") {
      const { post, tags } = resolved;
      const [postDetail, landingOrder] = await Promise.all([
        prepareMerkeziPostDetail({ post, tags }),
        getLandingOrder(),
      ]);
      const currentIndex = landingOrder.indexOf(post.slug);
      const previousSlug =
        currentIndex > 0 ? landingOrder[currentIndex - 1] ?? null : null;
      const nextSlug =
        currentIndex >= 0 ? landingOrder[currentIndex + 1] ?? null : null;

      return (
        <div className="min-h-screen bg-slate-50 py-8">
          <div className="mx-auto max-w-4xl px-4">
            <nav className="mb-6">
              <Link
                href={BACK_HREF}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Geri
              </Link>
            </nav>
            <MerkeziPostView
              post={postDetail.post}
              tags={postDetail.tags}
              viewCount={postDetail.viewCount}
              likeCount={postDetail.likeCount}
              userLiked={postDetail.userLiked}
              etiket={etiket ?? null}
              isPremium={postDetail.isPremium}
              contact={postDetail.contact}
            />
            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-700">Hizmetlerimiz</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Başvurunuzu güçlendiren ve vize sürecinizi hızlandıran çözümler</p>
              <div className="mt-3 grid grid-cols-[44fr_56fr] gap-2 sm:grid-cols-2">
                <Link
                  href="/yurtdisi-cv-paketi"
                  className="flex min-h-[74px] flex-col justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 hover:shadow-sm"
                >
                  <span className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">Yurtdışı CV Paketi</span>
                  <span className="truncate text-xs leading-4 text-slate-700">Uluslararası Standartta</span>
                </Link>
                <Link
                  href="/ucretsiz-vize-danismanligi"
                  className="flex min-h-[74px] flex-col justify-center rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-left transition hover:border-orange-300 hover:shadow-sm"
                >
                  <span className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">Ücretsiz Vize Danışmanlığı</span>
                  <span className="text-[11px] leading-4 text-slate-700 sm:text-xs">24 Saatte Danışman Atanır</span>
                </Link>
              </div>
            </section>
            <div className="mt-5">
              <PostNextNavigation
              previousSlug={previousSlug}
              nextSlug={nextSlug}
              />
            </div>
          </div>
        </div>
      );
    }

    if (resolved.kind === "sector") {
      const title =
        resolved.seoPage?.title ?? resolved.sectorSlug;
      const postTags = await getTagsByPostIds(resolved.posts.map((p) => p.id));
      return (
        <div className="min-h-screen bg-slate-50 py-8">
          <div className="mx-auto max-w-4xl px-4">
            <nav className="mb-6">
              <Link
                href={BACK_HREF}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Geri
              </Link>
            </nav>
            <MerkeziListView
              title={title}
              seoPage={resolved.seoPage}
              posts={resolved.posts}
              postTags={postTags}
            />
          </div>
        </div>
      );
    }

    const title =
      resolved.seoPage?.title ??
      (resolved.countrySlug ?? "") + " - " + (resolved.sectorSlug ?? "");
    const postTags = await getTagsByPostIds(resolved.posts.map((p) => p.id));
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="mb-6">
            <Link
              href={BACK_HREF}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Geri
            </Link>
          </nav>
          <MerkeziListView
            title={title}
            seoPage={resolved.seoPage}
            posts={resolved.posts}
            postTags={postTags}
          />
        </div>
      </div>
    );
  } catch (e) {
    console.error("[yurtdisi-is-ilanlari/segment]", e);
    notFound();
  }
}
