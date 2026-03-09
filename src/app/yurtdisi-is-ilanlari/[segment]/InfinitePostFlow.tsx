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
  const sectionElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const requestedNextBySlugRef = useRef<Record<string, boolean>>({});
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bottomMarkerVisible, setBottomMarkerVisible] = useState(false);
  const [lastScrollTs, setLastScrollTs] = useState(Date.now());
  const [isScrollIdle, setIsScrollIdle] = useState(false);
  const [autoLoadLocked, setAutoLoadLocked] = useState(false);
  const [lastLoadedSlug, setLastLoadedSlug] = useState<string | null>(null);
  const [readingProgressBySlug, setReadingProgressBySlug] = useState<
    Record<string, number>
  >({ [initial.post.slug]: 0 });

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

  useEffect(() => {
    const onScroll = () => setLastScrollTs(Date.now());
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsScrollIdle(false);
    const timer = setTimeout(() => setIsScrollIdle(true), 900);
    return () => clearTimeout(timer);
  }, [lastScrollTs]);

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
    if (!activeSlug) return;

    const updateProgress = () => {
      const el = sectionElementsRef.current.get(activeSlug);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const total = rect.height + viewportHeight;
      const progressed = viewportHeight - rect.top;
      const nextProgress = Math.max(0, Math.min(1, progressed / total));
      setReadingProgressBySlug((prev) => {
        const rounded = Number(nextProgress.toFixed(3));
        if (prev[activeSlug] === rounded) return prev;
        return { ...prev, [activeSlug]: rounded };
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [activeSlug]);

  useEffect(() => {
    if (!autoLoadLocked || !lastLoadedSlug) return;
    const progress = readingProgressBySlug[lastLoadedSlug] ?? 0;
    if (progress >= 0.4) {
      setAutoLoadLocked(false);
    }
  }, [autoLoadLocked, lastLoadedSlug, readingProgressBySlug]);

  useEffect(() => {
    const currentSlug = posts[posts.length - 1]?.post.slug;
    if (!currentSlug || !bottomMarkerVisible || !isScrollIdle) {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
      return;
    }
    if (autoLoadLocked || loadingNext || !hasMore) return;
    if (requestedNextBySlugRef.current[currentSlug]) return;
    if (activeSlug !== currentSlug) return;

    if (!loadTimerRef.current) {
      loadTimerRef.current = setTimeout(async () => {
        loadTimerRef.current = null;
        if (
          autoLoadLocked ||
          loadingNext ||
          !hasMore ||
          !bottomMarkerVisible ||
          !isScrollIdle
        ) {
          return;
        }
        requestedNextBySlugRef.current[currentSlug] = true;
        const loaded = await loadNext();
        if (loaded?.post?.slug) {
          setAutoLoadLocked(true);
          setLastLoadedSlug(loaded.post.slug);
          setReadingProgressBySlug((prev) => ({
            ...prev,
            [loaded.post.slug]: 0,
          }));
        } else {
          requestedNextBySlugRef.current[currentSlug] = false;
        }
      }, 1500);
    }

    return () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    };
  }, [
    activeSlug,
    autoLoadLocked,
    bottomMarkerVisible,
    hasMore,
    isScrollIdle,
    loadNext,
    loadingNext,
    posts,
  ]);

  return (
    <div className="space-y-0">
      {posts.map((item, index) => (
        <div
          key={item.post.id}
          ref={(el) => registerItemRef(item.post.slug, el)}
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
        <PostTransitionMarker
          loading={loadingNext}
          onVisibilityChange={setBottomMarkerVisible}
        />
      )}
    </div>
  );
}
