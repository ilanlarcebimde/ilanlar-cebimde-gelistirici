"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  MerkeziPostFlowItem,
  MerkeziPostFlowQueueItem,
} from "./types";

const MAX_INITIAL_QUEUE_FETCHES = 200;

export function useInfinitePosts(
  initial: MerkeziPostFlowItem,
  queue: MerkeziPostFlowQueueItem[]
) {
  const [posts, setPosts] = useState<MerkeziPostFlowItem[]>([initial]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [failedSlugs, setFailedSlugs] = useState<string[]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const attemptsRef = useRef(0);

  const loadedSlugs = useMemo(
    () => new Set(posts.map((item) => item.post.slug)),
    [posts]
  );

  const hasMore =
    nextIndex < queue.length &&
    attemptsRef.current < MAX_INITIAL_QUEUE_FETCHES;

  const loadNext = useCallback(async () => {
    if (loadingNext) return;
    if (nextIndex >= queue.length) return;

    setLoadingNext(true);
    try {
      let localIndex = nextIndex;
      while (localIndex < queue.length) {
        attemptsRef.current += 1;
        const nextSlug = queue[localIndex]?.slug;
        localIndex += 1;
        setNextIndex(localIndex);

        if (!nextSlug || loadedSlugs.has(nextSlug)) continue;

        const res = await fetch(
          `/api/merkezi/post-flow?slug=${encodeURIComponent(nextSlug)}`,
          { credentials: "include" }
        );
        if (!res.ok) {
          setFailedSlugs((prev) =>
            prev.includes(nextSlug) ? prev : [...prev, nextSlug]
          );
          continue;
        }
        const data = (await res.json()) as MerkeziPostFlowItem;
        if (!data?.post?.slug) continue;

        setPosts((prev) => {
          if (prev.some((item) => item.post.slug === data.post.slug)) {
            return prev;
          }
          return [...prev, data];
        });
        break;
      }
    } finally {
      setLoadingNext(false);
    }
  }, [loadedSlugs, loadingNext, nextIndex, queue]);

  return {
    posts,
    loadingNext,
    hasMore,
    loadNext,
    failedSlugs,
  };
}
