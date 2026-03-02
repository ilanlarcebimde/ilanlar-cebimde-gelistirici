import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveSegment, getPostCounts, getTagsByPostIds } from "@/lib/merkezi/server";
import { absoluteOgImageUrl, SITE_ORIGIN } from "@/lib/og";
import { MerkeziPostView } from "./MerkeziPostView";
import { MerkeziListView } from "./MerkeziListView";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { isPremiumSubscriptionActive } from "@/lib/premiumSubscription";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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
    const canonical = `${SITE_ORIGIN}${BASE}/${seg}`;
    const robots = etiket ? { index: false, follow: true } : undefined;

    if (resolved.kind === "post") {
      const post = resolved.post;
      const title = `${post?.title ?? "Yazı"} | İlanlar Cebimde`;
      const description = (post?.summary?.trim() || post?.title) ?? title;
      const slug = post?.slug ?? seg;
      const canonicalUrl = `${SITE_ORIGIN}${BASE}/${slug}`;
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
      const title = resolved.seoPage?.title ?? `${resolved.sectorSlug ?? "Sektör"} | İlanlar Cebimde`;
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
      `${resolved.countrySlug ?? "Ülke"} - ${resolved.sectorSlug ?? "Sektör"} | İlanlar Cebimde";
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
  const { segment } = await params;
  const { etiket } = await searchParams;

  const resolved = await resolveSegment(segment);
  if (!resolved) notFound();

  if (resolved.kind === "post") {
    const { post, tags } = resolved;
    const counts = await getPostCounts(post.id);

    const supabaseUser = await getSupabaseServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    const isPremium = user ? await isPremiumSubscriptionActive(user.id) : false;

    const supabaseAdmin = getSupabaseAdmin();
    const shouldIncludeContact =
      (!post.is_paid && post.show_contact_when_free) || (post.is_paid && isPremium);
    const { data: contact } = shouldIncludeContact
      ? await supabaseAdmin
          .from("merkezi_post_contact")
          .select("contact_email, contact_phone, apply_url")
          .eq("post_id", post.id)
          .maybeSingle()
      : { data: null };

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
            post={post}
            tags={tags}
            viewCount={counts.viewCount}
            likeCount={counts.likeCount}
            userLiked={false}
            etiket={etiket ?? null}
            isPremium={isPremium}
            contact={contact ?? null}
          />
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
}
