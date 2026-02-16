"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "taraflar", label: "Taraflar" },
  { id: "hizmetin-tanimi", label: "Hizmetin Tanımı" },
  { id: "hizmetin-niteligi", label: "Hizmetin Niteliği ve Garanti Vermeme" },
  { id: "kullanici-yukumlulukleri", label: "Kullanıcı Yükümlülükleri" },
  { id: "teknik-hizmet", label: "Teknik Hizmet ve Sorumluluk Sınırı" },
  { id: "ucretlendirme", label: "Ücretlendirme" },
  { id: "fikri-mulkiyet", label: "Fikri Mülkiyet" },
  { id: "sozlesmenin-feshi", label: "Sözleşmenin Feshi" },
  { id: "uyusmazlik-ve-yetki", label: "Uyuşmazlık ve Yetki" },
];

export function HizmetSozlesmesiClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Hizmet Sözleşmesi
            </h1>
            <p className="mt-3 text-slate-600">
              Hizmet kapsamı, kullanım şartları ve tarafların hak ve yükümlülükleri.
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
                İşbu Hizmet Sözleşmesi (“Sözleşme”), ilanlarcebimde.com ve bağlı dijital platformları işleten İlanlar Cebimde (“Platform”) ile Platform üzerinden sunulan hizmetlerden yararlanan gerçek veya tüzel kişi (“Kullanıcı”) arasında elektronik ortamda kurulmuştur.
              </p>
              <p className="mt-3 leading-relaxed">
                Kullanıcı, Platformu kullanarak işbu Sözleşme'yi okuduğunu, anladığını ve kabul ettiğini beyan eder.
              </p>
            </section>

            <section id="hizmetin-tanimi">
              <h2 className="text-xl font-semibold text-slate-900">2. Hizmetin Tanımı</h2>
              <p className="mt-3 leading-relaxed">Platform;</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>CV oluşturma ve düzenleme altyapısı,</li>
                <li>Başvuru süreci yönlendirmesi,</li>
                <li>Ülke ve sektör bazlı ilan derleme/yönlendirme,</li>
                <li>Bilgilendirici içerik sunumu,</li>
                <li>Reklam ve sponsorluk alanları</li>
              </ul>
              <p className="mt-3 leading-relaxed">gibi dijital hizmetler sunar.</p>
              <p className="mt-3 leading-relaxed">
                Platform iş bulma garantisi, işe yerleştirme taahhüdü, vize/çalışma izni garantisi veya kesin sonuç vermez.
              </p>
              <p className="mt-3 leading-relaxed">
                Sunulan hizmet; bilgi düzenleme, içerik üretim desteği ve yönlendirme niteliğindedir.
              </p>
            </section>

            <section id="hizmetin-niteligi">
              <h2 className="text-xl font-semibold text-slate-900">3. Hizmetin Niteliği ve Garanti Vermeme</h2>
              <p className="mt-3 leading-relaxed">
                Platform üzerindeki tüm hizmetler “olduğu gibi” sunulur.
              </p>
              <p className="mt-3 leading-relaxed">Platform:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>İşe kabul garantisi vermez</li>
                <li>Vize/çalışma izni garantisi vermez</li>
                <li>Başvuru sonucu üzerinde kontrol sahibi değildir</li>
                <li>Üçüncü taraf işveren kararlarından sorumlu değildir</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Kullanıcı, başvuru sürecinin nihai sonucunun kendi nitelikleri, işveren değerlendirmesi ve resmi süreçlere bağlı olduğunu kabul eder.
              </p>
            </section>

            <section id="kullanici-yukumlulukleri">
              <h2 className="text-xl font-semibold text-slate-900">4. Kullanıcı Yükümlülükleri</h2>
              <p className="mt-3 leading-relaxed">Kullanıcı:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Doğru ve güncel bilgi vermekle yükümlüdür</li>
                <li>Yanıltıcı, sahte veya üçüncü kişiye ait bilgi girmemelidir</li>
                <li>Platformu hukuka aykırı amaçla kullanamaz</li>
                <li>Başvuru sürecindeki resmi yükümlülüklerden kendisi sorumludur</li>
                <li>Yanlış veya eksik bilgi nedeniyle doğabilecek sonuçlardan Platform sorumlu değildir.</li>
              </ul>
            </section>

            <section id="teknik-hizmet">
              <h2 className="text-xl font-semibold text-slate-900">5. Teknik Hizmet ve Sorumluluk Sınırı</h2>
              <p className="mt-3 leading-relaxed">
                Platform dijital altyapı üzerinden hizmet sunar. Aşağıdaki durumlarda Platform sorumlu tutulamaz:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Sunucu kesintisi</li>
                <li>Bakım çalışmaları</li>
                <li>Siber saldırılar</li>
                <li>Üçüncü taraf hizmet kesintileri (barındırma, ödeme, e-posta vb.)</li>
                <li>Veri kaybı (mücbir sebep halleri dahil)</li>
                <li>İnternet erişim sorunları</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Platform, teknik arıza durumunda hizmeti yeniden sağlamak için makul çabayı gösterir; ancak kesintisiz hizmet garantisi vermez.
              </p>
            </section>

            <section id="ucretlendirme">
              <h2 className="text-xl font-semibold text-slate-900">6. Ücretlendirme</h2>
              <p className="mt-3 leading-relaxed">
                Hizmetler ücretli veya ücretsiz olabilir. Ücretli hizmetlerde:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Fiyatlar KDV hariç veya dahil olarak açıkça belirtilir</li>
                <li>Ödeme, Platformun entegre ettiği ödeme sistemleri üzerinden gerçekleştirilir</li>
                <li>Ödeme tamamlanmadan hizmet başlatılmayabilir</li>
                <li>Platform, fiyatlarda değişiklik yapma hakkını saklı tutar.</li>
              </ul>
            </section>

            <section id="fikri-mulkiyet">
              <h2 className="text-xl font-semibold text-slate-900">7. Fikri Mülkiyet</h2>
              <p className="mt-3 leading-relaxed">Platforma ait:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Yazılım</li>
                <li>Tasarım</li>
                <li>İçerik</li>
                <li>Marka ve logo</li>
                <li>Metin ve veri yapıları</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Platformun fikri mülkiyetindedir. İzinsiz kopyalanamaz, çoğaltılamaz, dağıtılamaz.
              </p>
            </section>

            <section id="sozlesmenin-feshi">
              <h2 className="text-xl font-semibold text-slate-900">8. Sözleşmenin Feshi</h2>
              <p className="mt-3 leading-relaxed">Platform;</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>Kullanım koşullarını ihlal eden</li>
                <li>Yanıltıcı bilgi veren</li>
                <li>Hukuka aykırı faaliyet yürüten</li>
              </ul>
              <p className="mt-2 leading-relaxed">
                kullanıcıların erişimini askıya alabilir veya tamamen sonlandırabilir.
              </p>
            </section>

            <section id="uyusmazlik-ve-yetki">
              <h2 className="text-xl font-semibold text-slate-900">9. Uyuşmazlık ve Yetki</h2>
              <p className="mt-3 leading-relaxed">
                Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır. Yetkili mahkemeler Platform merkezinin bulunduğu yer mahkemeleridir.
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
