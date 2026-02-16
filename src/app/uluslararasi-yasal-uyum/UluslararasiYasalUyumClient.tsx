"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "hukuki-statu", label: "Hukuki Statü" },
  { id: "uluslararasi-mevzuat-uyumu", label: "Uluslararası Mevzuat Uyumu" },
  { id: "goc-ve-calisma-surecleri", label: "Göç ve Çalışma Süreçleri" },
  { id: "reklam-ve-icerik-uyum", label: "Reklam ve İçerik Uyum Beyanı" },
  { id: "veri-koruma-ve-aktarim", label: "Veri Koruma ve Sınır Ötesi Aktarım" },
  { id: "hukuki-yorum-reddi", label: "Hukuki Yorum Reddi" },
  { id: "yetki-ve-uygulanacak-hukuk", label: "Yetki ve Uygulanacak Hukuk" },
];

export function UluslararasiYasalUyumClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Uluslararası Yasal Uyum
            </h1>
            <p className="mt-3 text-slate-600">
              Veri işleme, kullanıcı yönlendirme ve başvuru süreçlerinde hukuki çerçeve.
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
            <section id="hukuki-statu">
              <h2 className="text-xl font-semibold text-slate-900">1. Hukuki Statü</h2>
              <p className="mt-3 leading-relaxed">
                İlanlar Cebimde, dijital içerik ve başvuru düzenleme hizmeti sunan özel bir platformdur. Platform;
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Göçmenlik kurumu değildir</li>
                <li>Resmî konsolosluk değildir</li>
                <li>Çalışma izni otoritesi değildir</li>
                <li>İşe yerleştirme ajansı değildir (aksi açıkça belirtilmedikçe)</li>
              </ul>
            </section>

            <section id="uluslararasi-mevzuat-uyumu">
              <h2 className="text-xl font-semibold text-slate-900">2. Uluslararası Mevzuat Uyumu</h2>
              <p className="mt-3 leading-relaxed">Platform;</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Türkiye Cumhuriyeti mevzuatına</li>
                <li>KVKK ve ilgili veri koruma düzenlemelerine</li>
                <li>Uygulanabilir olduğu ölçüde GDPR ilkelerine</li>
                <li>Elektronik ticaret ve tüketici mevzuatına</li>
              </ul>
              <p className="mt-2 leading-relaxed">
                uyum sağlamak için makul teknik ve idari önlemleri uygular.
              </p>
              <p className="mt-3 leading-relaxed">
                Ancak farklı ülkelerin göçmenlik, istihdam ve vergi mevzuatları sürekli değişebilir. Platform bu mevzuat değişikliklerinden doğrudan sorumlu değildir.
              </p>
            </section>

            <section id="goc-ve-calisma-surecleri">
              <h2 className="text-xl font-semibold text-slate-900">3. Göç ve Çalışma Süreçleri</h2>
              <p className="mt-3 leading-relaxed">
                Vize, oturum, çalışma izni ve istihdam süreçleri ilgili ülke makamlarının yetkisindedir.
              </p>
              <p className="mt-3 leading-relaxed">Platform:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Başvuru dosyası hazırlamaz (resmî başvuru yerine geçmez)</li>
                <li>Resmî temsilcilik görevi üstlenmez</li>
                <li>Hukuki danışmanlık sağlamaz</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Kullanıcı, resmi başvuru süreçlerini ilgili makamlar üzerinden yürütmekle yükümlüdür.
              </p>
            </section>

            <section id="reklam-ve-icerik-uyum">
              <h2 className="text-xl font-semibold text-slate-900">4. Reklam ve İçerik Uyum Beyanı</h2>
              <p className="mt-3 leading-relaxed">
                Platform, yanıltıcı, garanti içeren, “%100 onay”, “kesin iş”, “garantili vize” gibi ifadeleri desteklemez.
              </p>
              <p className="mt-3 leading-relaxed">
                Reklamverenler ve içerik sağlayıcılar, sundukları hizmetlerin yasal uygunluğundan kendileri sorumludur.
              </p>
            </section>

            <section id="veri-koruma-ve-aktarim">
              <h2 className="text-xl font-semibold text-slate-900">5. Veri Koruma ve Sınır Ötesi Aktarım</h2>
              <p className="mt-3 leading-relaxed">
                Platform altyapısında kullanılan sunucular ve teknik servis sağlayıcılar farklı ülkelerde bulunabilir.
              </p>
              <p className="mt-3 leading-relaxed">
                Veriler, yürürlükteki veri koruma mevzuatına uygun güvenlik önlemleri çerçevesinde işlenir.
              </p>
              <p className="mt-3 leading-relaxed">
                Ancak internet ortamında mutlak güvenlik garanti edilemez.
              </p>
            </section>

            <section id="hukuki-yorum-reddi">
              <h2 className="text-xl font-semibold text-slate-900">6. Hukuki Yorum Reddi</h2>
              <p className="mt-3 leading-relaxed">
                Platform üzerinde yer alan hiçbir içerik:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Hukuki tavsiye</li>
                <li>Mali danışmanlık</li>
                <li>Resmî göçmenlik rehberi</li>
                <li>Kesin iş vaadi</li>
              </ul>
              <p className="mt-2 leading-relaxed">olarak yorumlanamaz.</p>
              <p className="mt-3 leading-relaxed">
                Kullanıcı nihai kararları almadan önce ilgili resmi makamlarla veya yetkili danışmanlarla görüşmelidir.
              </p>
            </section>

            <section id="yetki-ve-uygulanacak-hukuk">
              <h2 className="text-xl font-semibold text-slate-900">7. Yetki ve Uygulanacak Hukuk</h2>
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
