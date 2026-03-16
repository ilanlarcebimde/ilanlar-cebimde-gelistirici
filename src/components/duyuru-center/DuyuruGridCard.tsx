import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { DuyuruCardBadges } from "./DuyuruCardBadges";
import { DuyuruCardMeta } from "./DuyuruCardMeta";
import { DuyuruPost } from "./types";

type DuyuruGridCardProps = {
  post: DuyuruPost;
  countryLabel: string | null;
  featured?: boolean;
};

export function DuyuruGridCard({ post, countryLabel, featured = false }: DuyuruGridCardProps) {
  const summaryText =
    post.summary?.replace(/\s+/g, " ").trim() || "Detaylı duyuru içeriği için devamını görüntüleyin.";
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="grid md:grid-cols-[48%_52%]">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-200 bg-slate-100 md:h-full md:aspect-auto md:border-b-0 md:border-r">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-contain md:object-cover transition-transform duration-300 group-hover:scale-[1.015]"
              sizes="(max-width: 768px) 100vw, 48vw"
              unoptimized={post.cover_image_url.includes("supabase")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
              <ShieldCheck className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="flex min-h-[250px] flex-col gap-3 p-4 md:min-h-[290px] md:max-h-[360px] md:p-5">
          <DuyuruCardBadges post={post} countryLabel={countryLabel} featured={featured} />

          <h2 className="line-clamp-2 text-xl font-bold leading-tight tracking-tight text-slate-900 md:line-clamp-3 md:text-2xl">
            {post.title}
          </h2>

          <p className="line-clamp-3 text-sm leading-6 text-slate-600">{summaryText}</p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3.5">
            <DuyuruCardMeta post={post} compact />
            <Link
              href={`/yurtdisi-calisma-ve-vize-duyurulari/${post.slug}`}
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Duyurunun Tamamını Gör
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
