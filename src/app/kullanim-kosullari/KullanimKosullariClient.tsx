"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "genel-ilkeler", label: "Genel İlkeler" },
  { id: "yasakli-kullanimlar", label: "Yasaklı Kullanımlar" },
  { id: "ucuncu-taraf-icerikleri", label: "Üçüncü Taraf İçerikleri" },
  { id: "icerik-dogrulugu", label: "İçerik Doğruluğu" },
  { id: "hizmette-degisiklik", label: "Hizmette Değişiklik" },
];

export function KullanimKosullariClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Kullanım Koşulları
            </h1>
            <p className="mt-3 text-slate-600">
              Site ve hizmetlerin kullanımına ilişkin kurallar, sorumluluk sınırları ve kullanıcı yükümlülükleri.
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
            <section id="genel-ilkeler">
              <h2 className="text-xl font-semibold text-slate-900">1. Genel İlkeler</h2>
              <p className="mt-3 leading-relaxed">
                Platform; iş arama sürecini düzenlemeye yardımcı bir dijital altyapıdır. Platform bir resmi kurum değildir.
              </p>
              <p className="mt-3 leading-relaxed">
                Platform üzerinden yapılan yönlendirmeler, ilanlar ve içerikler bilgilendirme amaçlıdır.
              </p>
            </section>

            <section id="yasakli-kullanimlar">
              <h2 className="text-xl font-semibold text-slate-900">2. Yasaklı Kullanımlar</h2>
              <p className="mt-3 leading-relaxed">
                Kullanıcı aşağıdaki eylemleri gerçekleştiremez:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Sahte ilan verme</li>
                <li>Dolandırıcılık amacıyla içerik oluşturma</li>
                <li>Başkası adına yetkisiz işlem yapma</li>
                <li>Sistem açıklarını kötüye kullanma</li>
                <li>Otomatik bot / scraping / veri çekme</li>
                <li>Telif ihlali yapma</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Bu tür durumlarda Platform hukuki yollara başvurma hakkını saklı tutar.
              </p>
            </section>

            <section id="ucuncu-taraf-icerikleri">
              <h2 className="text-xl font-semibold text-slate-900">3. Üçüncü Taraf İçerikleri</h2>
              <p className="mt-3 leading-relaxed">
                Platform; üçüncü taraf ilanlara veya web sitelerine yönlendirme yapabilir. Bu içeriklerin doğruluğundan ve güvenliğinden ilgili üçüncü taraf sorumludur.
              </p>
            </section>

            <section id="icerik-dogrulugu">
              <h2 className="text-xl font-semibold text-slate-900">4. İçerik Doğruluğu</h2>
              <p className="mt-3 leading-relaxed">
                Platform makul özen gösterse de; ilan metinleri, ücret bilgileri, sektör açıklamaları zaman içinde değişebilir. Kullanıcı nihai başvuru öncesi resmi kaynaklardan doğrulama yapmalıdır.
              </p>
            </section>

            <section id="hizmette-degisiklik">
              <h2 className="text-xl font-semibold text-slate-900">5. Hizmette Değişiklik</h2>
              <p className="mt-3 leading-relaxed">
                Platform; hizmet kapsamını, arayüzü, fiyatlandırmayı ve özellikleri önceden bildirim yapmaksızın güncelleme hakkına sahiptir.
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
