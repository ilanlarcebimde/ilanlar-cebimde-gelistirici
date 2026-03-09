"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { MerkeziPostFlowItem } from "./types";

export function useInfinitePosts(initial: MerkeziPostFlowItem) {
  const [posts, setPosts] = useState<MerkeziPostFlowItem[]>([initial]);
  const [loadingNext, setLoadingNext] = useState(false);
  const loadedSlugsRef = useRef<Set<string>>(new Set([initial.post.slug]));

  const loadedSlugs = useMemo(
    () => new Set(posts.map((item) => item.post.slug)),
    [posts]
  );

  const appendPostBySlug = useCallback(
    async (slug: string): Promise<MerkeziPostFlowItem | null> => {
      if (loadingNext || !slug) return null;
      if (loadedSlugsRef.current.has(slug) || loadedSlugs.has(slug)) return null;

    setLoadingNext(true);
    try {
      const res = await fetch(
        `/api/merkezi/post-flow?slug=${encodeURIComponent(slug)}`,
        { credentials: "include" }
      );
      if (!res.ok) return null;
      const data = (await res.json()) as MerkeziPostFlowItem;
      if (!data?.post?.slug) return null;
      if (loadedSlugsRef.current.has(data.post.slug)) return null;

      loadedSlugsRef.current.add(data.post.slug);
      setPosts((prev) => {
        if (prev.some((item) => item.post.slug === data.post.slug)) {
          return prev;
        }
        return [...prev, data];
      });
      return data;
    } finally {
      setLoadingNext(false);
    }
    },
    [loadedSlugs, loadingNext]
  );

  return {
    posts,
    loadingNext,
    appendPostBySlug,
    loadedSlugs,
  };
}
