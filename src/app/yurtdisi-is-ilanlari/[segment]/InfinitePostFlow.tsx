"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MerkeziPostView } from "./MerkeziPostView";
import { PostTransitionMarker } from "@/components/merkezi/PostTransitionMarker";
import { useInfinitePosts } from "@/lib/merkezi/useInfinitePosts";
import { useActivePostOnScroll } from "@/lib/merkezi/useActivePostOnScroll";
import type {
  MerkeziPostFlowItem,
  MerkeziPostFlowQueueItem,
} from "@/lib/merkezi/types";

function FlowSection({
  slug,
  children,
  onMount,
}: {
  slug: string;
  children: ReactNode;
  onMount?: () => void;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    onMount?.();
    return () => window.cancelAnimationFrame(frame);
  }, [onMount]);

  return (
    <section
      data-post-slug={slug}
      className={`transition-all duration-300 ease-out ${
        entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {children}
    </section>
  );
}

interface InfinitePostFlowProps {
  initial: MerkeziPostFlowItem;
  queue: MerkeziPostFlowQueueItem[];
  initialEtiket: string | null;
}

export function InfinitePostFlow({
  initial,
  queue,
  initialEtiket,
}: InfinitePostFlowProps) {
  const router = useRouter();
  const { posts, hasMore, loadingNext, loadNext } = useInfinitePosts(
    initial,
    queue
  );
  const { activeSlug, registerSectionRef } = useActivePostOnScroll(posts);

  const titleBySlug = useMemo(
    () =>
      new Map(
        posts.map((item) => [
          item.post.slug,
          `${item.post.title} | İlanlar Cebimde`,
        ])
      ),
    [posts]
  );

  useEffect(() => {
    if (!activeSlug) return;
    const currentUrl = new URL(window.location.href);
    const nextPath = `/yurtdisi-is-ilanlari/${activeSlug}${
      currentUrl.search || ""
    }`;
    router.replace(nextPath, { scroll: false });
    const nextTitle = titleBySlug.get(activeSlug);
    if (nextTitle) document.title = nextTitle;
  }, [activeSlug, router, titleBySlug]);

  return (
    <div className="space-y-0">
      {posts.map((item, index) => (
        <div
          key={item.post.id}
          ref={(el) => registerSectionRef(item.post.slug, el)}
          className="mb-10 last:mb-0"
        >
          {index > 0 && <PostTransitionMarker />}
          <FlowSection slug={item.post.slug}>
            <MerkeziPostView
              post={item.post}
              tags={item.tags}
              viewCount={item.viewCount}
              likeCount={item.likeCount}
              userLiked={item.userLiked}
              etiket={index === 0 ? initialEtiket : null}
              isPremium={item.isPremium}
              contact={item.contact}
            />
          </FlowSection>
        </div>
      ))}

      {hasMore && (
        <PostTransitionMarker loading={loadingNext} onVisible={loadNext} />
      )}
    </div>
  );
}
