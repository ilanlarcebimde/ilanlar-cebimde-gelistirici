"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "amac-ve-kapsam", label: "Amaç ve Kapsam" },
  { id: "cerez-nedir", label: "Çerez Nedir?" },
  { id: "hangi-tur-cerezler", label: "Hangi Tür Çerezleri Kullanıyoruz?" },
  { id: "cerezleri-hangi-amaclarla", label: "Çerezleri Hangi Amaçlarla Kullanıyoruz?" },
  { id: "ucuncu-taraf-cerezleri", label: "Üçüncü Taraf Çerezleri ve Hizmetler" },
  { id: "cerez-tercihleri", label: "Çerez Tercihleri ve Yönetimi" },
  { id: "politika-guncellemeleri", label: "Politika Güncellemeleri" },
  { id: "iletisim", label: "İletişim" },
];

export function CerezPolicyClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          {/* Hero */}
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Çerez Politikası
            </h1>
            <p className="mt-3 text-slate-600">
              Çerez türleri, kullanım amaçları ve tercihlerinizin yönetimi hakkında bilgilendirme.
            </p>
            <p className="mt-2 text-sm text-slate-500">Son güncelleme: Şubat 2026</p>
          </section>

          {/* İçindekiler */}
          <nav className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6" aria-label="İçindekiler">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">İçindekiler</h2>
            <ul className="mt-3 space-y-2">
              {TOC.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`#${item.id}`}
                    className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900 hover:decoration-slate-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* İçerik */}
          <article className="space-y-10 text-slate-700 [overflow-wrap:anywhere]">
            <section id="amac-ve-kapsam">
              <h2 className="text-xl font-semibold text-slate-900">1) Amaç ve Kapsam</h2>
              <p className="mt-3 leading-relaxed">
                Bu Çerez Politikası, ilanlarcebimde.com (“Site”) ve Site üzerinden sunulan hizmetlerde kullanılan çerezler ve benzeri teknolojiler (piksel etiketleri, yerel depolama, SDK vb.) hakkında bilgilendirme amacı taşır. Siteyi ziyaret ettiğinizde, cihazınıza çerezler yerleştirilebilir ve/veya mevcut çerezler okunabilir.
              </p>
            </section>

            <section id="cerez-nedir">
              <h2 className="text-xl font-semibold text-slate-900">2) Çerez Nedir?</h2>
              <p className="mt-3 leading-relaxed">
                Çerezler; Siteyi ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler sayesinde Site daha verimli çalışabilir, kullanıcı deneyimi iyileştirilebilir ve bazı tercihleriniz hatırlanabilir.
              </p>
            </section>

            <section id="hangi-tur-cerezler">
              <h2 className="text-xl font-semibold text-slate-900">3) Hangi Tür Çerezleri Kullanıyoruz?</h2>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                    A) Zorunlu Çerezler (Kesinlikle Gerekli)
                  </h3>
                  <p className="mt-3 leading-relaxed">
                    Bu çerezler Site'nin çalışması için gereklidir. Örneğin:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                    <li>Oturum yönetimi ve güvenli giriş</li>
                    <li>Form/sihirbaz adımlarında ilerleme ve kayıt akışı</li>
                    <li>Dolandırıcılık ve kötüye kullanım önleme</li>
                    <li>Güvenlik doğrulamaları ve hata tespiti</li>
                  </ul>
                  <p className="mt-3 text-sm leading-relaxed">
                    Not: Zorunlu çerezlerin devre dışı bırakılması, Site'nin düzgün çalışmamasına neden olabilir.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="inline-block rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-800">
                    B) İşlevsellik Çerezleri
                  </h3>
                  <p className="mt-3 leading-relaxed">
                    Tercihlerinizi (dil, bölge, görüntü ayarları vb.) hatırlayarak kişiselleştirilmiş deneyim sunar.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                    C) Analitik / Performans Çerezleri
                  </h3>
                  <p className="mt-3 leading-relaxed">
                    Site performansını ve kullanıcı deneyimini geliştirmek için anonim/istatistiksel ölçüm sağlar. Örneğin:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                    <li>Sayfa görüntüleme, tıklama, oturum süresi</li>
                    <li>Hata oranları, performans metrikleri</li>
                    <li>Hangi sayfaların daha çok kullanıldığını anlama</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                    D) Reklam / Pazarlama Çerezleri (Varsa)
                  </h3>
                  <p className="mt-3 leading-relaxed">
                    Kampanyaların etkinliğini ölçmek ve ilgi alanınıza göre içerik göstermek için kullanılabilir. Bu çerezler ancak açık rızanız ile etkinleşir.
                  </p>
                </div>
              </div>
            </section>

            <section id="cerezleri-hangi-amaclarla">
              <h2 className="text-xl font-semibold text-slate-900">4) Çerezleri Hangi Amaçlarla Kullanıyoruz?</h2>
              <ul className="mt-3 list-inside list-disc space-y-2 leading-relaxed">
                <li>Siteyi güvenli ve çalışır durumda tutmak</li>
                <li>Başvuru/CV oluşturma sürecini sürdürülebilir kılmak</li>
                <li>Tercihleri hatırlamak ve kullanıcı deneyimini iyileştirmek</li>
                <li>Dolandırıcılık ve kötüye kullanım tespiti yapmak</li>
                <li>Analitik ölçümleme ile hizmet kalitesini artırmak</li>
              </ul>
            </section>

            <section id="ucuncu-taraf-cerezleri">
              <h2 className="text-xl font-semibold text-slate-900">5) Üçüncü Taraf Çerezleri ve Hizmetler</h2>
              <p className="mt-3 leading-relaxed">
                Site; barındırma, güvenlik, analitik, ödeme, e-posta gönderimi ve dosya depolama gibi amaçlarla üçüncü taraf hizmetler kullanabilir. Bu hizmet sağlayıcılar kendi çerezlerini yerleştirebilir ve/veya benzeri teknolojiler kullanabilir. Üçüncü tarafların çerez uygulamaları kendi politikalarına tabidir.
              </p>
            </section>

            <section id="cerez-tercihleri">
              <h2 className="text-xl font-semibold text-slate-900">6) Çerez Tercihleri ve Yönetimi</h2>
              <p className="mt-3 leading-relaxed">
                Çerez tercihlerinizi:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Site üzerindeki çerez bildirim panelinden (varsa)</li>
                <li>Tarayıcı ayarlarınızdan (Chrome/Firefox/Safari/Edge)</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                yönetebilirsiniz. Çerezleri engellemeniz halinde bazı özellikler çalışmayabilir veya hizmet kalitesi düşebilir.
              </p>
            </section>

            <section id="politika-guncellemeleri">
              <h2 className="text-xl font-semibold text-slate-900">7) Politika Güncellemeleri</h2>
              <p className="mt-3 leading-relaxed">
                Çerez Politikası; yasal zorunluluklar, teknik değişiklikler ve hizmet geliştirmeleri kapsamında güncellenebilir. Güncel metin Site'de yayımlandığı anda geçerli olur.
              </p>
            </section>

            <section id="iletisim">
              <h2 className="text-xl font-semibold text-slate-900">8) İletişim</h2>
              <p className="mt-3 leading-relaxed">
                Çerezler ve veri işleme süreçleri hakkında sorular için:
              </p>
              <p className="mt-2">
                E-posta:{" "}
                <a
                  href="mailto:destek@yurtdisieleman.net"
                  className="text-slate-800 underline [overflow-wrap:anywhere] hover:text-slate-900"
                >
                  destek@yurtdisieleman.net
                </a>
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
