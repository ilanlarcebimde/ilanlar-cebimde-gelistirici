"use client";

import Image from "next/image";
import type { MerkeziPost } from "@/lib/merkezi/types";

export function CompanyCard({ post }: { post: MerkeziPost }) {
  const name = post.company_name?.trim();
  const desc = post.company_short_description?.trim();
  const logo = post.company_logo_url?.trim();
  const location = [post.country_slug, post.city].filter(Boolean).join(", ");

  if (!name && !desc && !logo && !location) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        {logo && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <Image
              src={logo}
              alt=""
              width={56}
              height={56}
              className="object-cover"
              unoptimized={logo.startsWith("data:") || logo.includes("supabase")}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {name && <h3 className="font-semibold text-slate-900">{name}</h3>}
          {location && (
            <p className="mt-0.5 text-sm text-slate-500">{location}</p>
          )}
          {desc && (
            <p className="mt-2 text-sm text-slate-600">{desc}</p>
          )}
        </div>
      </div>
    </div>
  );
}
