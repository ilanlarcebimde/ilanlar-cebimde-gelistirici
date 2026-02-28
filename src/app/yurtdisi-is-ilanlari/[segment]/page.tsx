import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveSegment, getPostCounts, getTagsByPostIds } from "@/lib/merkezi/server";
import { MerkeziPostView } from "./MerkeziPostView";
import { MerkeziListView } from "./MerkeziListView";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { isPremiumSubscriptionActive } from "@/lib/premiumSubscription";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const BASE = "/yurtdisi-is-ilanlari";
const BASE_URL = "https://www.ilanlarcebimde.com";

/** Yazı detayı her istekte güncel (kapak, özet vb.) olsun. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function absoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url.startsWith("/") ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
}

interface PageProps {
  params: Promise<{ segment: string }>;
  searchParams: Promise<{ etiket?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { segment } = await params;
  const { etiket } = await searchParams;
  const resolved = await resolveSegment(segment);
  if (!resolved) return { title: "Bulunamadı | İlanlar Cebimde" };
  const canonical = `${BASE_URL}${BASE}/${segment}`;
  const robots = etiket ? { index: false, follow: true } : undefined;

  if (resolved.kind === "post") {
    const post = resolved.post;
    const title = `${post.title} | İlanlar Cebimde`;
    const description = post.summary?.trim() || post.title;
    const canonicalUrl = `${BASE_URL}${BASE}/${post.slug}`;
    const coverUrl = post.cover_image_url ? absoluteUrl(post.cover_image_url) : undefined;
    const ogImages = coverUrl
      ? [{ url: coverUrl, width: 1200, height: 630, alt: post.title }]
      : [];
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
        images: ogImages,
        locale: "tr_TR",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: coverUrl ? [coverUrl] : [],
      },
    };
  }

  if (resolved.kind === "sector") {
    const title = resolved.seoPage?.title ?? `${resolved.sectorSlug} | İlanlar Cebimde`;
    return {
      title,
      description: resolved.seoPage?.meta_description ?? undefined,
      alternates: { canonical },
      robots,
      openGraph: {
        title,
        description: resolved.seoPage?.meta_description ?? undefined,
        images: resolved.seoPage?.cover_image_url
          ? [{ url: resolved.seoPage.cover_image_url, width: 1200, height: 630 }]
          : [],
      },
    };
  }

  const title =
    resolved.seoPage?.title ??
    `${resolved.countrySlug} - ${resolved.sectorSlug} | İlanlar Cebimde`;
  return {
    title,
    description: resolved.seoPage?.meta_description ?? undefined,
    alternates: { canonical },
    robots,
    openGraph: {
      title,
      description: resolved.seoPage?.meta_description ?? undefined,
      images: resolved.seoPage?.cover_image_url
        ? [{ url: resolved.seoPage.cover_image_url, width: 1200, height: 630 }]
        : [],
    },
  };
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
              href={BASE}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Yurtdışı İş İlanları
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
              href={BASE}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Yurtdışı İş İlanları
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
    `${resolved.countrySlug} – ${resolved.sectorSlug}`;
  const postTags = await getTagsByPostIds(resolved.posts.map((p) => p.id));
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <nav className="mb-6">
          <Link
            href={BASE}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Yurtdışı İş İlanları
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
