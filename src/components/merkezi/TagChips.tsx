"use client";

import Link from "next/link";
import type { MerkeziTag } from "@/lib/merkezi/types";

const BASE = "/yurtdisi-is-ilanlari";

export function TagChips({
  tags,
  currentEtiket,
  baseSegment,
}: {
  tags: MerkeziTag[];
  currentEtiket?: string | null;
  baseSegment: string;
}) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const isActive = currentEtiket === t.slug;
        const href = isActive
          ? `${BASE}/${baseSegment}`
          : `${BASE}/${baseSegment}?etiket=${encodeURIComponent(t.slug)}`;
        return (
          <Link
            key={t.id}
            href={href}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              isActive
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t.name}
          </Link>
        );
      })}
    </div>
  );
}
