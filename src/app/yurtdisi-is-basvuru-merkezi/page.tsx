import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPostsForMerkeziLanding } from "@/lib/merkezi/server";
import { RehberlerSection } from "@/components/merkezi/RehberlerSection";

export const metadata: Metadata = {
  title: "Yurtdışı İş Başvuru Merkezi | İlanlar Cebimde",
  description:
    "Yurtdışı iş ilanları, resmi duyurular ve başvuru rehberleri tek merkezde. Sektör ve ülke bazlı ilanları keşfedin, güvenli başvuru adımlarını öğrenin.",
};

export default async function YurtdisiIsBasvuruMerkeziPage() {
  const { posts, tagsByPostId } = await getPublishedPostsForMerkeziLanding();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Yurtdışı İş Başvuru Merkezi
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
          Bu merkezde, sektör ve ülke bazlı yurtdışı iş ilanlarını ve başvuru rehberlerini tek
          yerde topluyoruz. Ücretli içeriklerde hızlı başvuru araçlarına, ücretsiz içeriklerde
          faydalı yönlendirmelere ulaşabilirsin.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-xl text-sky-600" aria-hidden>
              📋
            </span>
            <h2 className="mt-3 font-semibold text-slate-900">Ücretsiz İlanları Gör</h2>
            <p className="mt-1 text-sm text-slate-600">
              Ücretsiz ilan akışını görüntüle ve ülke kanallarına abone ol.
            </p>
            <div className="mt-auto border-t border-slate-200 pt-3">
              <Link
                href="/ucretsiz-yurtdisi-is-ilanlari"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Görüntüle <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-600" aria-hidden>
              📚
            </span>
            <h2 className="mt-3 font-semibold text-slate-900">Tüm Rehberler</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sektör ve ülke bazlı tüm rehber listesine git.
            </p>
            <div className="mt-auto border-t border-slate-200 pt-3">
              <Link
                href="/yurtdisi-is-ilanlari"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Listele <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>

        <RehberlerSection posts={posts} tagsByPostId={tagsByPostId} />
      </div>
    </div>
  );
}
