import Image from "next/image";
import { ImageIcon } from "lucide-react";

type DuyuruCoverImageProps = {
  title: string;
  imageUrl: string | null | undefined;
};

export function DuyuruCoverImage({ title, imageUrl }: DuyuruCoverImageProps) {
  if (!imageUrl) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-56 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 md:h-72">
          <ImageIcon className="h-10 w-10" />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[1200/630] w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 1200px"
          unoptimized={imageUrl.includes("supabase")}
        />
      </div>
    </section>
  );
}
