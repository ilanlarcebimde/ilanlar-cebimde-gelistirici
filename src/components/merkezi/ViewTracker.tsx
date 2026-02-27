"use client";

import { useEffect, useRef } from "react";

export function ViewTracker({ postId }: { postId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !postId) return;
    sent.current = true;
    fetch(`/api/merkezi/post/${postId}/view`, { method: "POST", credentials: "include" }).catch(() => {});
  }, [postId]);

  return null;
}
