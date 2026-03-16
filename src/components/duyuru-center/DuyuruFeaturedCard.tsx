import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { DuyuruCardBadges } from "./DuyuruCardBadges";
import { DuyuruCardMeta } from "./DuyuruCardMeta";
import { DuyuruPost } from "./types";

type DuyuruFeaturedCardProps = {
  post: DuyuruPost;
  countryLabel: string | null;
};

export function DuyuruFeaturedCard({ post, countryLabel }: DuyuruFeaturedCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm ring-1 ring-slate-200/70">
      <div className="grid lg:min-h-[320px] lg:max-h-[380px] lg:grid-cols-[5fr_7fr]">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-100 bg-slate-50 lg:h-full lg:aspect-auto lg:border-b-0 lg:border-r">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 48vw"
              unoptimized={post.cover_image_url.includes("supabase")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
              <ShieldCheck className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3.5 p-5 lg:p-6">
          <DuyuruCardBadges post={post} countryLabel={countryLabel} featured />

          <h2 className="line-clamp-2 text-xl font-bold leading-tight tracking-tight text-slate-900 lg:line-clamp-3 lg:text-2xl">
            {post.title}
          </h2>

          <p className="line-clamp-2 text-sm leading-6 text-slate-600 lg:line-clamp-3">
            {post.summary?.trim() || "Detaylı duyuru içeriği için devamını görüntüleyin."}
          </p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
            <DuyuruCardMeta post={post} compact />
            <Link
              href={`/yurtdisi-calisma-ve-vize-duyurulari/${post.slug}`}
              className="inline-flex items-center rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Duyurunun Tamamını Gör
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
