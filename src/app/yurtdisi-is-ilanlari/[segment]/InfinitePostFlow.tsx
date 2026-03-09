"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MerkeziPostView } from "./MerkeziPostView";
import { PostTransitionMarker } from "@/components/merkezi/PostTransitionMarker";
import { useInfinitePosts } from "@/lib/merkezi/useInfinitePosts";
import { useActivePostOnScroll } from "@/lib/merkezi/useActivePostOnScroll";
import type {
  MerkeziPostFlowItem,
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
  landingOrder: string[];
  initialEtiket: string | null;
}

export function InfinitePostFlow({
  initial,
  landingOrder,
  initialEtiket,
}: InfinitePostFlowProps) {
  const router = useRouter();
  const { posts, loadingNext, appendPostBySlug, loadedSlugs } =
    useInfinitePosts(initial);
  const { activeSlug, registerSectionRef } = useActivePostOnScroll(posts);
  const sectionElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingScrollSlugRef = useRef<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const index = landingOrder.indexOf(initial.post.slug);
    return index >= 0 ? index : 0;
  });
  const [hasMore, setHasMore] = useState(
    currentIndex < landingOrder.length - 1
  );

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

  const registerItemRef = useCallback(
    (slug: string, el: HTMLDivElement | null) => {
      registerSectionRef(slug, el);
      if (!slug) return;
      if (!el) {
        sectionElementsRef.current.delete(slug);
        return;
      }
      sectionElementsRef.current.set(slug, el);
    },
    [registerSectionRef]
  );

  useEffect(() => {
    const targetSlug = pendingScrollSlugRef.current;
    if (!targetSlug) return;
    const el = sectionElementsRef.current.get(targetSlug);
    if (!el) return;
    pendingScrollSlugRef.current = null;
    const top =
      el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: "smooth" });
  }, [posts]);

  const handleLoadMore = useCallback(async () => {
    if (loadingNext || !hasMore) return;
    let nextIndex = currentIndex + 1;

    while (nextIndex < landingOrder.length) {
      const nextSlug = landingOrder[nextIndex];
      if (!nextSlug || loadedSlugs.has(nextSlug)) {
        nextIndex += 1;
        continue;
      }

      const loaded = await appendPostBySlug(nextSlug);
      if (loaded?.post?.slug && !loadedSlugs.has(loaded.post.slug)) {
        setCurrentIndex(nextIndex);
        setHasMore(nextIndex < landingOrder.length - 1);
        pendingScrollSlugRef.current = loaded.post.slug;
        return;
      }
      nextIndex += 1;
    }

    setHasMore(false);
  }, [
    appendPostBySlug,
    currentIndex,
    hasMore,
    landingOrder,
    loadedSlugs,
    loadingNext,
  ]);

  return (
    <div className="space-y-0">
      {posts.map((item, index) => (
        <div
          key={item.post.id}
          ref={(el) => registerItemRef(item.post.slug, el)}
          className="mb-10 last:mb-0"
        >
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
            {index === posts.length - 1 && (
              <PostTransitionMarker
                loading={loadingNext}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
              />
            )}
          </FlowSection>
        </div>
      ))}
    </div>
  );
}
