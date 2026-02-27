"use client";

import { useState } from "react";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  initialLiked?: boolean;
  onToggle?: (liked: boolean) => void;
}

export function LikeButton({
  postId,
  initialCount,
  initialLiked = false,
  onToggle,
}: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/merkezi/post/${postId}/like`, {
        method: liked ? "DELETE" : "POST",
        credentials: "include",
      });
      if (res.ok) {
        const next = !liked;
        setLiked(next);
        setCount((c) => (next ? c + 1 : c - 1));
        onToggle?.(next);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      aria-pressed={liked}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
