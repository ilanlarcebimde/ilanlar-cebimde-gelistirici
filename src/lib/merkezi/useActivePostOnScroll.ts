"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MerkeziPostFlowItem } from "./types";

export function useActivePostOnScroll(posts: MerkeziPostFlowItem[]) {
  const sectionMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const [activeSlug, setActiveSlug] = useState(posts[0]?.post.slug ?? "");

  const slugs = useMemo(() => posts.map((item) => item.post.slug), [posts]);

  const registerSectionRef = useCallback(
    (slug: string, el: HTMLElement | null) => {
      if (!slug) return;
      if (!el) {
        sectionMapRef.current.delete(slug);
        return;
      }
      sectionMapRef.current.set(slug, el);
    },
    []
  );

  useEffect(() => {
    if (!slugs.length) return;

    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const viewportCenter = window.innerHeight / 2;
      let bestSlug = slugs[0];
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const slug of slugs) {
        const el = sectionMapRef.current.get(slug);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - viewportCenter);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSlug = slug;
        }
      }

      setActiveSlug((prev) => (prev === bestSlug ? prev : bestSlug));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActive);
    };

    updateActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [slugs]);

  return {
    activeSlug,
    registerSectionRef,
  };
}
