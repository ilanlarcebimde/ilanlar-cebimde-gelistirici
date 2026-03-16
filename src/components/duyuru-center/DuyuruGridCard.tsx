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
  return (
    <article
      className={`group overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        featured ? "border-slate-300 ring-1 ring-slate-200/70" : "border-slate-200"
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-100 bg-slate-50">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={post.cover_image_url.includes("supabase")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
            <ShieldCheck className="h-9 w-9" />
          </div>
        )}
      </div>

      <div className="space-y-3.5 p-5">
        <DuyuruCardBadges post={post} countryLabel={countryLabel} featured={featured} />

        <h2 className="line-clamp-2 text-xl font-bold leading-tight tracking-tight text-slate-900">{post.title}</h2>

        <p className="line-clamp-2 text-sm leading-7 text-slate-600">
          {post.summary?.trim() || "Detaylı duyuru içeriği için devamını görüntüleyin."}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
          <DuyuruCardMeta post={post} compact />
          <Link
            href={`/yurtdisi-calisma-ve-vize-duyurulari/${post.slug}`}
            className="inline-flex items-center rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Duyuruyu Oku
          </Link>
        </div>
      </div>
    </article>
  );
}
