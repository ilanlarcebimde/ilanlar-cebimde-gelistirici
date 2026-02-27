import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yurtdışı İş Başvuru Merkezi | İlanlar Cebimde",
  description:
    "Yurtdışı iş ilanları, resmi duyurular ve başvuru rehberleri tek merkezde. Sektör ve ülke bazlı ilanları keşfedin, güvenli başvuru adımlarını öğrenin.",
};

export default function YurtdisiIsBasvuruMerkeziPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Yurtdışı İş Başvuru Merkezi
        </h1>
        <p className="mt-3 text-sm text-slate-700 md:text-base">
          Bu merkezde, sektör ve ülke bazlı yurtdışı iş ilanlarını, resmi kaynaklara dayalı
          başvuru rehberlerini ve premium başvuru araçlarını tek yerde topluyoruz.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Ücretsiz Yurtdışı İş İlanları
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Ücretsiz ilan akışını görmek ve ülke kanallarına abone olmak için buradan devam
              edebilirsin.
            </p>
            <Link
              href="/ucretsiz-yurtdisi-is-ilanlari"
              className="mt-3 inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Ücretsiz İlanları Gör
            </Link>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Sektör &amp; Ülke Bazlı Rehberler
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Almanya inşaat, Katar otelcilik gibi ülke+sektör sayfaları için SEO odaklı
              içerikleri buradan yayınlayacaksın.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Admin olarak yeni içerikleri <code className="font-mono">/admin</code> panelinden
              oluşturup yayınlayabilirsin.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

