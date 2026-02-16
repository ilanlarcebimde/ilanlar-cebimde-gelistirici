"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "dijital-hizmet-niteligi", label: "Dijital Hizmet Niteliği" },
  { id: "iade-kosullari", label: "İade Koşulları" },
  { id: "teknik-hata-kaynakli-iade", label: "Teknik Hata Kaynaklı İade" },
  { id: "iade-sureci", label: "İade Süreci" },
  { id: "sorumluluk-siniri", label: "Sorumluluk Sınırı" },
  { id: "mucbir-sebep", label: "Mücbir Sebep" },
];

export function IadeVeGeriOdemeClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              İade ve Geri Ödeme Politikası
            </h1>
            <p className="mt-3 text-slate-600">
              İptal, iade şartları ve geri ödeme süreçleri hakkında bilgilendirme.
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
            <section id="dijital-hizmet-niteligi">
              <h2 className="text-xl font-semibold text-slate-900">1. Dijital Hizmet Niteliği</h2>
              <p className="mt-3 leading-relaxed">
                Platform tarafından sunulan CV oluşturma, başvuru düzenleme ve benzeri hizmetler dijital içerik ve anında ifa edilen hizmet niteliğindedir.
              </p>
              <p className="mt-3 leading-relaxed">
                Kullanıcı ödeme sonrası hizmet üretimi başlatıldığında, hizmet ifası başlamış sayılır.
              </p>
            </section>

            <section id="iade-kosullari">
              <h2 className="text-xl font-semibold text-slate-900">2. İade Koşulları</h2>
              <p className="mt-3 leading-relaxed">
                Aşağıdaki durumlarda iade yapılmaz:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>CV oluşturma süreci tamamlandıysa</li>
                <li>Dijital içerik teslim edildiyse</li>
                <li>Kullanıcı yanlış bilgi girdiği için memnuniyetsizlik oluştuysa</li>
                <li>İşe kabul gerçekleşmemesi</li>
                <li>Vize/izin sürecinin olumsuz sonuçlanması</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Platform; iş sonucu üzerinden ücret iadesi yapmaz.
              </p>
            </section>

            <section id="teknik-hata-kaynakli-iade">
              <h2 className="text-xl font-semibold text-slate-900">3. Teknik Hata Kaynaklı İade</h2>
              <p className="mt-3 leading-relaxed">
                Aşağıdaki durumlarda değerlendirme yapılabilir:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Sistemsel hata nedeniyle hizmet hiç üretilememişse</li>
                <li>Ödeme alınmış ancak hizmet sunulamamışsa</li>
                <li>Aynı işlem için mükerrer tahsilat yapılmışsa</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Bu durumlar teknik inceleme sonrası karara bağlanır.
              </p>
            </section>

            <section id="iade-sureci">
              <h2 className="text-xl font-semibold text-slate-900">4. İade Süreci</h2>
              <p className="mt-3 leading-relaxed">
                İade talepleri:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Yazılı başvuru ile</li>
                <li>Ödeme bilgileri belirtilerek</li>
                <li>İnceleme süresi içinde</li>
              </ul>
              <p className="mt-2 leading-relaxed">
                değerlendirilir.
              </p>
              <p className="mt-3 leading-relaxed">
                Uygun görülen iadeler, ödeme yöntemine göre makul süre içinde gerçekleştirilir.
              </p>
            </section>

            <section id="sorumluluk-siniri">
              <h2 className="text-xl font-semibold text-slate-900">5. Sorumluluk Sınırı</h2>
              <p className="mt-3 leading-relaxed">
                Platformun toplam mali sorumluluğu, ilgili hizmet için ödenen tutar ile sınırlıdır.
              </p>
              <p className="mt-3 leading-relaxed">
                Dolaylı zarar, kar kaybı, fırsat kaybı, işe yerleşememe gibi sonuçlardan Platform sorumlu tutulamaz.
              </p>
            </section>

            <section id="mucbir-sebep">
              <h2 className="text-xl font-semibold text-slate-900">6. Mücbir Sebep</h2>
              <p className="mt-3 leading-relaxed">
                Doğal afet, savaş, siber saldırı, devlet müdahalesi, altyapı kesintisi gibi mücbir sebeplerden kaynaklı hizmet aksaklıklarında Platform sorumlu değildir.
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
