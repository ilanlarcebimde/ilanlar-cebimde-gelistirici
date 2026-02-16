"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "destek-kapsami", label: "Destek Kapsamı" },
  { id: "yanit-suresi", label: "Yanıt Süresi" },
  { id: "destek-sinirlari", label: "Destek Sınırları" },
  { id: "kotuye-kullanim", label: "Kötüye Kullanım" },
  { id: "teknik-arizalar", label: "Teknik Arızalar" },
];

export function MusteriHizmetleriPolitikasiClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Müşteri Hizmetleri Politikası
            </h1>
            <p className="mt-3 text-slate-600">
              Destek kanalları, geri dönüş süreleri ve iletişim ilkeleri.
            </p>
            <p className="mt-2 text-sm text-slate-500">Son güncelleme: Şubat 2026</p>
          </section>

          <nav className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" aria-label="İçindekiler">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">İçindekiler</h2>
            <ul className="mt-3 space-y-2">
              {TOC.map((item) => (
                <li key={item.id}>
                  <Link href={`#${item.id}`} className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900 hover:decoration-slate-500">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <article className="space-y-10 text-slate-700 [overflow-wrap:anywhere]">
            <section id="destek-kapsami">
              <h2 className="text-xl font-semibold text-slate-900">1. Destek Kapsamı</h2>
              <p className="mt-3 leading-relaxed">
                Müşteri hizmetleri aşağıdaki konularda destek sağlar:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Teknik sorunlar</li>
                <li>Ödeme işlemleri</li>
                <li>Hesap erişim problemleri</li>
                <li>Hizmet kullanım rehberliği</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Destek hizmeti; işe yerleştirme, vize süreci yürütme veya resmi temsil niteliği taşımaz.
              </p>
            </section>

            <section id="yanit-suresi">
              <h2 className="text-xl font-semibold text-slate-900">2. Yanıt Süresi</h2>
              <p className="mt-3 leading-relaxed">
                Destek talepleri, yoğunluğa bağlı olarak makul süre içinde değerlendirilir. Platform belirli bir süre garantisi vermez.
              </p>
            </section>

            <section id="destek-sinirlari">
              <h2 className="text-xl font-semibold text-slate-900">3. Destek Sınırları</h2>
              <p className="mt-3 leading-relaxed">
                Aşağıdaki konular destek kapsamı dışındadır:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>İşverenle yaşanan bireysel anlaşmazlıklar</li>
                <li>Vize reddi veya resmi kurum kararları</li>
                <li>Üçüncü taraf platformlarda yaşanan problemler</li>
                <li>Kullanıcının yanlış bilgi vermesinden doğan sonuçlar</li>
              </ul>
            </section>

            <section id="kotuye-kullanim">
              <h2 className="text-xl font-semibold text-slate-900">4. Kötüye Kullanım</h2>
              <p className="mt-3 leading-relaxed">
                Hakaret, tehdit, yanıltıcı beyan, spam veya kötüye kullanım durumlarında Platform destek hizmetini sonlandırma hakkını saklı tutar.
              </p>
            </section>

            <section id="teknik-arizalar">
              <h2 className="text-xl font-semibold text-slate-900">5. Teknik Arızalar</h2>
              <p className="mt-3 leading-relaxed">
                Bakım, güncelleme, siber saldırı, altyapı kesintisi gibi durumlarda hizmet geçici olarak aksayabilir. Platform bu kesintilerden doğan dolaylı zararlardan sorumlu değildir.
              </p>
            </section>
          </article>

          <div className="mt-12">
            <Link href="/" className="text-sm text-slate-600 underline hover:text-slate-900">
              ← Ana sayfaya dön
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
