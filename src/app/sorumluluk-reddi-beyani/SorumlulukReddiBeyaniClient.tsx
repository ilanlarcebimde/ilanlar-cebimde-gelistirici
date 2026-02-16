"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "genel-bilgilendirme", label: "Genel Bilgilendirme Niteliği" },
  { id: "garanti-vermeme", label: "Garanti Vermeme" },
  { id: "ucuncu-taraf-sorumlulugu", label: "Üçüncü Taraf Sorumluluğu" },
  { id: "kullanici-beyani", label: "Kullanıcı Beyanı ve Sorumluluğu" },
  { id: "teknik-sorumluluk-siniri", label: "Teknik Sorumluluk Sınırı" },
  { id: "mali-sorumluluk-siniri", label: "Mali Sorumluluk Sınırı" },
  { id: "mucbir-sebep", label: "Mücbir Sebep" },
];

export function SorumlulukReddiBeyaniClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Sorumluluk Reddi Beyanı
            </h1>
            <p className="mt-3 text-slate-600">
              İçerik, ilan yönlendirme ve kullanıcı beyanlarına ilişkin hukuki bilgilendirme.
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
            <section id="genel-bilgilendirme">
              <h2 className="text-xl font-semibold text-slate-900">1. Genel Bilgilendirme Niteliği</h2>
              <p className="mt-3 leading-relaxed">
                İlanlar Cebimde ve bağlı dijital platformlar (ilanlarcebimde.com, yurtdisieleman vb.) üzerinden sunulan tüm içerik, ilan yönlendirmeleri, CV oluşturma hizmetleri, başvuru metinleri, rehber yazılar ve bilgilendirmeler yalnızca genel bilgilendirme ve dijital düzenleme hizmeti niteliğindedir.
              </p>
              <p className="mt-3 leading-relaxed">Platform;</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>İşe yerleştirme kurumu değildir.</li>
                <li>Resmî devlet kurumu değildir.</li>
                <li>Vize veya çalışma izni veren bir kurum değildir.</li>
                <li>Hukuki, mali veya göçmenlik danışmanlığı hizmeti sunmaz.</li>
              </ul>
            </section>

            <section id="garanti-vermeme">
              <h2 className="text-xl font-semibold text-slate-900">2. Garanti Vermeme</h2>
              <p className="mt-3 leading-relaxed">
                Platform hiçbir şekilde:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>İşe kabul garantisi</li>
                <li>Vize / oturum / çalışma izni garantisi</li>
                <li>İşveren geri dönüş garantisi</li>
                <li>Belirli süre içinde iş bulma garantisi</li>
                <li>Gelir veya kazanç garantisi</li>
              </ul>
              <p className="mt-2 leading-relaxed">vermez.</p>
              <p className="mt-3 leading-relaxed">
                Başvuru sürecinin nihai sonucu; işveren değerlendirmesi, resmi kurum kararları ve kullanıcının kişisel yeterlilikleri doğrultusunda şekillenir.
              </p>
            </section>

            <section id="ucuncu-taraf-sorumlulugu">
              <h2 className="text-xl font-semibold text-slate-900">3. Üçüncü Taraf Sorumluluğu</h2>
              <p className="mt-3 leading-relaxed">
                Platform üzerinden yönlendirilen:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>İş ilanları</li>
                <li>İşveren web siteleri</li>
                <li>Resmî kurum sayfaları</li>
                <li>Üçüncü taraf hizmet sağlayıcıları</li>
              </ul>
              <p className="mt-2 leading-relaxed">
                kendi sorumluluk alanlarına tabidir.
              </p>
              <p className="mt-3 leading-relaxed">
                İşverenlerin işe alım süreçleri, ücret politikaları, sözleşme şartları ve resmi kurum kararlarından Platform sorumlu değildir.
              </p>
            </section>

            <section id="kullanici-beyani">
              <h2 className="text-xl font-semibold text-slate-900">4. Kullanıcı Beyanı ve Sorumluluğu</h2>
              <p className="mt-3 leading-relaxed">Kullanıcı;</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Girdiği bilgilerin doğru ve güncel olduğunu,</li>
                <li>Sahte, yanıltıcı veya üçüncü kişiye ait veri kullanmadığını,</li>
                <li>Başvuru sürecindeki yasal yükümlülüklerin kendisine ait olduğunu</li>
              </ul>
              <p className="mt-2 leading-relaxed">kabul eder.</p>
              <p className="mt-3 leading-relaxed">
                Yanlış veya eksik beyan nedeniyle doğabilecek her türlü sonuç kullanıcının sorumluluğundadır.
              </p>
            </section>

            <section id="teknik-sorumluluk-siniri">
              <h2 className="text-xl font-semibold text-slate-900">5. Teknik Sorumluluk Sınırı</h2>
              <p className="mt-3 leading-relaxed">
                Platform dijital altyapı üzerinden hizmet sunar.
              </p>
              <p className="mt-3 leading-relaxed">
                Aşağıdaki durumlarda Platform sorumlu tutulamaz:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Sunucu kesintisi</li>
                <li>Siber saldırı</li>
                <li>Veri kaybı (mücbir sebep halleri dahil)</li>
                <li>Altyapı sağlayıcı kesintisi</li>
                <li>Ödeme sistem hataları</li>
                <li>E-posta iletim problemleri</li>
                <li>İnternet bağlantı sorunları</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Platform, kesintisiz ve hatasız hizmet garantisi vermez.
              </p>
            </section>

            <section id="mali-sorumluluk-siniri">
              <h2 className="text-xl font-semibold text-slate-900">6. Mali Sorumluluk Sınırı</h2>
              <p className="mt-3 leading-relaxed">
                Platformun toplam mali sorumluluğu, ilgili hizmet için ödenen tutar ile sınırlıdır.
              </p>
              <p className="mt-3 leading-relaxed">
                Dolaylı zarar, itibar kaybı, fırsat kaybı, işe kabul edilmeme, vize reddi, gelir kaybı gibi sonuçlardan Platform sorumlu tutulamaz.
              </p>
            </section>

            <section id="mucbir-sebep">
              <h2 className="text-xl font-semibold text-slate-900">7. Mücbir Sebep</h2>
              <p className="mt-3 leading-relaxed">
                Doğal afet, savaş, kamu otoritesi kararı, altyapı çökmesi, küresel sistem arızası, siber saldırı gibi öngörülemeyen ve kontrol dışı durumlarda Platform sorumlu değildir.
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
