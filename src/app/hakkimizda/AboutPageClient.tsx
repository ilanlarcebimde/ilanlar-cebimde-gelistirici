"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

/** Görsel eklenirse: Next/Image ile loading="lazy" ve alt="Yurtdışı iş başvuru süreci dijital platform" kullanın. */
function HeroPlaceholder() {
  return (
    <div
      className="relative flex aspect-[21/9] min-h-[180px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-white"
      role="img"
      aria-label="Yurtdışı iş başvuru süreci dijital platform"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-24 w-24 rounded-full bg-slate-200/60" />
        <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/80" />
      </div>
    </div>
  );
}

export function AboutPageClient() {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push("/");
  };

  return (
    <>
      <Header onLoginClick={handleLoginClick} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
          {/* Hero */}
          <section className="mb-16">
            <HeroPlaceholder />
            <h1 className="mt-10 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              İlanlar Cebimde Hakkımızda
            </h1>
          </section>

          {/* Dijital İş Başvuru Ekosistemi */}
          <section className="py-16">
            <h2 className="text-2xl font-semibold text-slate-900">
              Dijital İş Başvuru Ekosistemi
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
              İlanlar Cebimde, yurtiçi ve özellikle yurtdışında çalışmak isteyen adaylara doğru
              ilanları, doğru kaynakları ve doğru başvuru adımlarını sunmak amacıyla kurulmuş çok
              kanallı bir dijital ekosistemdir.
            </p>
          </section>

          {/* Ekosistem Yapımız */}
          <section className="py-16">
            <h2 className="text-2xl font-semibold text-slate-900">Ekosistem Yapımız</h2>
            <p className="mt-3 max-w-3xl text-slate-600">
              Ekosistemimiz üç temel yapı üzerine kuruludur:
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Facebook Toplulukları ve Sayfaları
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  İş arayanların aktif olarak bulunduğu, sektör ve ülke bazlı ilanların paylaşıldığı
                  dinamik topluluk alanlarıdır. Bu kanallar; hızlı bilgilendirme, etkileşim ve güncel
                  duyurular için güçlü bir iletişim ağı oluşturur.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">yurtdisieleman.net</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Rehber içerikler, süreç bilgilendirmeleri ve başvuru adımlarını sadeleştiren içerik
                  altyapımızdır. Vize, çalışma izni, sektör bazlı alımlar ve başvuru süreçleri gibi
                  konularda kullanıcıya netlik kazandırmayı hedefler.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
                <h3 className="text-lg font-semibold text-slate-900">ilanlarcebimde.com</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Kullanıcıyı tercihine göre yönlendiren, ilanları derleyen ve doğru başvuru noktasına
                  ulaştıran sistem yaklaşımımızdır. Aynı zamanda profesyonel başvuru altyapısı (CV ve
                  başvuru süreci desteği) sunar.
                </p>
              </article>
            </div>
          </section>

          {/* Misyonumuz */}
          <section className="py-16">
            <h2 className="text-2xl font-semibold text-slate-900">Misyonumuz</h2>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
              Misyonumuz; iş arayanların zaman kaybını azaltmak, güvenilir kaynakları görünür kılmak
              ve başvuru sürecini daha sistemli, anlaşılır ve güvenli hale getirmektir.
            </p>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
              Biz yalnızca ilan paylaşmayı değil; süreci anlamayı, doğru adımı atmayı ve bilinçli
              başvuru yapmayı önemsiyoruz.
            </p>
          </section>

          {/* Yaklaşımımız */}
          <section className="py-16">
            <h2 className="text-2xl font-semibold text-slate-900">Yaklaşımımız</h2>
            <p className="mt-4 max-w-3xl text-lg font-medium text-slate-700">
              Teknoloji + Şeffaflık + Süreç Odaklılık.
            </p>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
              Kaynakları düzenli tarar, bilgiyi sadeleştirir, kullanıcıyı mümkün olan her durumda
              resmi ve doğru başvuru kanallarına yönlendiririz.
            </p>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
              İlanlar Cebimde; karmaşık görünen iş arama sürecini daha net, daha ölçülebilir ve daha
              güçlü hale getirmeyi hedefler.
            </p>
          </section>

          {/* Footer note */}
          <section className="border-t border-slate-200/70 pt-10">
            <p className="text-sm text-slate-500">
              İlanlar Cebimde, Yurtdışı Eleman markası ve ekosistemi bünyesinde faaliyet
              göstermektedir.
            </p>
            <div className="mt-8">
              <Link
                href="/"
                className="text-sm text-slate-600 underline hover:text-slate-900"
              >
                ← Ana sayfaya dön
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
