import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { isPremiumSubscriptionActive } from "@/lib/premiumSubscription";
import {
  getPostCounts,
  getPublishedPostsForMerkeziLanding,
} from "./server";
import type {
  MerkeziPost,
  MerkeziPostContact,
  MerkeziPostDetailData,
  MerkeziTag,
} from "./types";

async function getPostDetailContact(
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
  try {
    const supabaseUser = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    return user ? await isPremiumSubscriptionActive(user.id) : false;
  } catch {
    return false;
  }
}

export async function prepareMerkeziPostDetail(input: {
  post: MerkeziPost;
  tags: MerkeziTag[];
  isPremium?: boolean;
}): Promise<MerkeziPostDetailData> {
  let isPremium: boolean;
  let viewCount = 0;
  let likeCount = 0;
  let contact: MerkeziPostContact | null = null;

  try {
    isPremium =
      typeof input.isPremium === "boolean"
        ? input.isPremium
        : await getCurrentUserPremiumState();
  } catch {
    isPremium = false;
  }

  try {
    const [countsResult, contactResult] = await Promise.all([
      getPostCounts(input.post.id),
      getPostDetailContact(input.post, isPremium),
    ]);
    viewCount = countsResult.viewCount ?? 0;
    likeCount = countsResult.likeCount ?? 0;
    contact = contactResult;
  } catch {
    // keep defaults
  }

  return {
    post: input.post,
    tags: input.tags,
    contact,
    isPremium,
    viewCount,
    likeCount,
    userLiked: false,
  };
}

export async function getLandingOrder(limit = 500): Promise<string[]> {
  try {
    const { posts } = await getPublishedPostsForMerkeziLanding(limit);
    const seen = new Set<string>();

    return posts
      .map((post) => post.slug?.trim())
      .filter((slug): slug is string => {
        if (!slug || seen.has(slug)) return false;
        seen.add(slug);
        return true;
      });
  } catch {
    return [];
  }
}
