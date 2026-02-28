"use client";

import Link from "next/link";
import type { MerkeziTag } from "@/lib/merkezi/types";

const BASE = "/yurtdisi-is-ilanlari";
const MAX_VISIBLE = 6;

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
  const visible = tags.slice(0, MAX_VISIBLE);
  const extra = tags.length - MAX_VISIBLE;
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((t) => {
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
      {extra > 0 && (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">
          +{extra}
        </span>
      )}
    </div>
  );
}
