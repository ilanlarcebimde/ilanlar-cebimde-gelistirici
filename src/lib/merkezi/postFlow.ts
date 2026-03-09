import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { isPremiumSubscriptionActive } from "@/lib/premiumSubscription";
import {
  getPostCounts,
  getPublishedPostBySlug,
  getPublishedPostsForMerkeziLanding,
} from "./server";
import type {
  MerkeziPost,
  MerkeziPostContact,
  MerkeziPostFlowItem,
  MerkeziPostFlowQueueItem,
  MerkeziTag,
} from "./types";

async function getPostFlowContact(
  post: MerkeziPost,
  isPremium: boolean
): Promise<MerkeziPostContact | null> {
  const shouldIncludeContact =
    (!post.is_paid && post.show_contact_when_free) || (post.is_paid && isPremium);
  if (!shouldIncludeContact) return null;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data } = await supabaseAdmin
      .from("merkezi_post_contact")
      .select("contact_email, contact_phone, apply_url")
      .eq("post_id", post.id)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUserPremiumState(): Promise<boolean> {
  const supabaseUser = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  return user ? await isPremiumSubscriptionActive(user.id) : false;
}

export async function preparePostFlowItem(input: {
  post: MerkeziPost;
  tags: MerkeziTag[];
  isPremium?: boolean;
}): Promise<MerkeziPostFlowItem> {
  const isPremium =
    typeof input.isPremium === "boolean"
      ? input.isPremium
      : await getCurrentUserPremiumState();
  const [counts, contact] = await Promise.all([
    getPostCounts(input.post.id),
    getPostFlowContact(input.post, isPremium),
  ]);

  return {
    post: input.post,
    tags: input.tags,
    contact,
    isPremium,
    viewCount: counts.viewCount,
    likeCount: counts.likeCount,
    userLiked: false,
  };
}

export async function getPreparedPostFlowItemBySlug(
  slug: string
): Promise<MerkeziPostFlowItem | null> {
  const resolved = await getPublishedPostBySlug(slug);
  if (!resolved) return null;
  const isPremium = await getCurrentUserPremiumState();
  return preparePostFlowItem({
    post: resolved.post,
    tags: resolved.tags,
    isPremium,
  });
}

function getRecencyValue(post: {
  published_at?: string | null;
  created_at?: string | null;
}): number {
  return (
    new Date(post.published_at ?? post.created_at ?? 0).getTime() || 0
  );
}

export async function buildInitialPostFlowQueue(
  currentPost: MerkeziPost,
  limit = 60
): Promise<MerkeziPostFlowQueueItem[]> {
  const { posts } = await getPublishedPostsForMerkeziLanding(
    Math.min(limit + 20, 120)
  );

  return posts
    .filter((post) => post.slug !== currentPost.slug)
    .sort((a, b) => {
      const aCountry = a.country_slug === currentPost.country_slug ? 0 : 1;
      const bCountry = b.country_slug === currentPost.country_slug ? 0 : 1;
      if (aCountry !== bCountry) return aCountry - bCountry;

      const aSector = a.sector_slug === currentPost.sector_slug ? 0 : 1;
      const bSector = b.sector_slug === currentPost.sector_slug ? 0 : 1;
      if (aSector !== bSector) return aSector - bSector;

      return getRecencyValue(b) - getRecencyValue(a);
    })
    .slice(0, limit)
    .map((post) => ({ slug: post.slug }));
}
