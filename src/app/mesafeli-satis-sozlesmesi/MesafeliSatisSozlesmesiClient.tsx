"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "taraflar", label: "Taraflar" },
  { id: "hizmet-konusu", label: "Hizmet Konusu" },
  { id: "hizmetin-ifasi", label: "Hizmetin İfası" },
  { id: "cayma-hakki", label: "Cayma Hakkı" },
  { id: "iade-sartlari", label: "İade Şartları" },
  { id: "sorumluluk-reddi", label: "Sorumluluk Reddi" },
  { id: "mucbir-sebep", label: "Mücbir Sebep" },
  { id: "uyusmazlik", label: "Uyuşmazlık" },
];

export function MesafeliSatisSozlesmesiClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Mesafeli Satış Sözleşmesi
            </h1>
            <p className="mt-3 text-slate-600">
              Sipariş, ödeme, teslimat, cayma ve iade süreçleri ile tarafların hak ve yükümlülükleri.
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
            <section id="taraflar">
              <h2 className="text-xl font-semibold text-slate-900">1. Taraflar</h2>
              <p className="mt-3 leading-relaxed">
                Bu Mesafeli Satış Sözleşmesi, ilanlarcebimde.com üzerinden dijital hizmet satın alan kullanıcı ile Platform arasında elektronik ortamda kurulmuştur.
              </p>
              <p className="mt-3 leading-relaxed">
                Kullanıcı, ödeme işlemini tamamlayarak sözleşmeyi kabul etmiş sayılır.
              </p>
            </section>

            <section id="hizmet-konusu">
              <h2 className="text-xl font-semibold text-slate-900">2. Hizmet Konusu</h2>
              <p className="mt-3 leading-relaxed">
                Satın alınan hizmet:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>CV oluşturma ve düzenleme</li>
                <li>Başvuru metni oluşturma</li>
                <li>Dijital yönlendirme hizmeti</li>
                <li>İlan eşleştirme altyapısı</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Hizmet dijital içerik niteliğindedir.
              </p>
            </section>

            <section id="hizmetin-ifasi">
              <h2 className="text-xl font-semibold text-slate-900">3. Hizmetin İfası</h2>
              <p className="mt-3 leading-relaxed">
                Ödeme tamamlandıktan sonra hizmet üretim süreci başlatılır.
              </p>
              <p className="mt-3 leading-relaxed">
                Dijital içerik oluşturulmaya başlandığında hizmet ifası başlamış kabul edilir.
              </p>
            </section>

            <section id="cayma-hakki">
              <h2 className="text-xl font-semibold text-slate-900">4. Cayma Hakkı</h2>
              <p className="mt-3 leading-relaxed">
                Tüketici mevzuatı uyarınca, anında ifa edilen dijital içerik hizmetlerinde, hizmetin başlamasıyla birlikte cayma hakkı sınırlanabilir.
              </p>
              <p className="mt-3 leading-relaxed">
                CV üretimi veya dijital içerik oluşturulmuşsa, iade hakkı bulunmayabilir.
              </p>
            </section>

            <section id="iade-sartlari">
              <h2 className="text-xl font-semibold text-slate-900">5. İade Şartları</h2>
              <p className="mt-3 leading-relaxed">
                Aşağıdaki durumlarda iade yapılmaz:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>CV teslim edilmişse</li>
                <li>Hizmet tamamlanmışsa</li>
                <li>İşe kabul gerçekleşmemişse</li>
                <li>Vize/izin reddedilmişse</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Teknik hata nedeniyle hizmet hiç sunulmamışsa inceleme yapılabilir.
              </p>
            </section>

            <section id="sorumluluk-reddi">
              <h2 className="text-xl font-semibold text-slate-900">6. Sorumluluk Reddi</h2>
              <p className="mt-3 leading-relaxed">Platform:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>İşe kabul sonucu üzerinde kontrol sahibi değildir</li>
                <li>Resmi kurum kararlarından sorumlu değildir</li>
                <li>Üçüncü taraf işveren uygulamalarından sorumlu değildir</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Kullanıcı, hizmetin bilgilendirme ve düzenleme amacı taşıdığını kabul eder.
              </p>
            </section>

            <section id="mucbir-sebep">
              <h2 className="text-xl font-semibold text-slate-900">7. Mücbir Sebep</h2>
              <p className="mt-3 leading-relaxed">
                Doğal afet, savaş, devlet müdahalesi, siber saldırı, altyapı kesintisi gibi durumlarda Platform sorumlu değildir.
              </p>
            </section>

            <section id="uyusmazlik">
              <h2 className="text-xl font-semibold text-slate-900">8. Uyuşmazlık</h2>
              <p className="mt-3 leading-relaxed">
                Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır. Yetkili mahkeme Platform merkezinin bulunduğu yer mahkemeleridir.
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
