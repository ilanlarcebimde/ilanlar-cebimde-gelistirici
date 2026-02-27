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
          <Link
            href="/ucretsiz-yurtdisi-is-ilanlari"
            className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-xl text-sky-600" aria-hidden>
              📋
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900 group-hover:text-sky-700">
                Ücretsiz İlanları Gör
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Ücretsiz ilan akışını görüntüle ve ülke kanallarına abone ol.
              </p>
              <span className="mt-2 inline-flex items-center text-sm font-medium text-sky-600 group-hover:text-sky-700" aria-hidden>
                Görüntüle →
              </span>
            </div>
          </Link>

          <Link
            href="/yurtdisi-is-ilanlari"
            className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-600" aria-hidden>
              📚
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900 group-hover:text-sky-700">
                Tüm Rehberler
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Sektör ve ülke bazlı tüm rehber listesine git.
              </p>
              <span className="mt-2 inline-flex items-center text-sm font-medium text-sky-600 group-hover:text-sky-700" aria-hidden>
                Listele →
              </span>
            </div>
          </Link>
        </div>

        <RehberlerSection posts={posts} tagsByPostId={tagsByPostId} />
      </div>
    </div>
  );
}
