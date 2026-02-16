"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "amac-kapsam-ve-tanimlar", label: "Amaç, Kapsam ve Tanımlar" },
  { id: "hangi-verileri-isleyebiliriz", label: "Hangi Verileri İşleyebiliriz?" },
  { id: "verileri-hangi-amaclarla-isliyoruz", label: "Verileri Hangi Amaçlarla İşliyoruz?" },
  { id: "hukuki-sebepler", label: "Hukuki Sebepler (KVKK/GDPR Yaklaşımı)" },
  { id: "verilerin-paylasimi", label: "Verilerin Paylaşımı (Kimlerle, Ne Amaçla?)" },
  { id: "yurt-disina-veri-aktarimi", label: "Yurt Dışına Veri Aktarımı" },
  { id: "veri-guvenligi", label: "Veri Güvenliği" },
  { id: "sorumlulugun-sinirlandirilmasi", label: "Sorumluluğun Sınırlandırılması" },
  { id: "saklama-sureleri", label: "Saklama Süreleri" },
  { id: "kullanici-haklari", label: "Kullanıcı Hakları" },
  { id: "cocuklarin-gizliligi", label: "Çocukların Gizliliği" },
  { id: "politika-guncellemeleri", label: "Politika Güncellemeleri" },
  { id: "iletisim", label: "İletişim" },
];

export function GizlilikPolicyClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          {/* Hero */}
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Gizlilik Politikası
            </h1>
            <p className="mt-3 text-slate-600">
              Kişisel verilerinizin işlenmesi, saklanması ve haklarınız hakkında bilgilendirme.
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
            <section id="amac-kapsam-ve-tanimlar">
              <h2 className="text-xl font-semibold text-slate-900">1) Amaç, Kapsam ve Tanımlar</h2>
              <p className="mt-3 leading-relaxed">
                Bu Gizlilik Politikası, ilanlarcebimde.com (“Site”) ve Site üzerinden sunulan hizmetlerde kişisel verilerin işlenmesine ilişkin esasları açıklar. Siteyi ziyaret ederek ve/veya hizmetleri kullanarak bu Politikayı okuduğunuzu ve anladığınızı kabul etmiş sayılırsınız.
              </p>
              <p className="mt-3 font-medium text-slate-800">Önemli Uyarı (Garanti Yoktur):</p>
              <p className="mt-1 leading-relaxed">
                İlanlar Cebimde ve bağlı platformlar (yurtdisieleman vb.) iş bulma, vize/oturum izni, işe kabul, kesin dönüşüm, kesin sonuç gibi herhangi bir garanti vermez. Site üzerinden sunulan içerikler ve yönlendirmeler bilgilendirme ve süreç kolaylaştırma amaçlıdır.
              </p>
            </section>

            <section id="hangi-verileri-isleyebiliriz">
              <h2 className="text-xl font-semibold text-slate-900">2) Hangi Verileri İşleyebiliriz?</h2>
              <p className="mt-3 leading-relaxed">
                Kullandığınız hizmete bağlı olarak aşağıdaki veriler işlenebilir:
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">A) Kimlik ve İletişim</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
                    <li>Ad soyad</li>
                    <li>Telefon numarası</li>
                    <li>E-posta adresi</li>
                    <li>Şehir/ülke bilgisi</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">B) Başvuru/CV İçeriği (Kullanıcı Beyanı)</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
                    <li>Meslek unvanı, deneyim süresi, iş özeti</li>
                    <li>Eğitim seviyesi, yabancı dil seviyesi</li>
                    <li>Ehliyet/pasaport durumu, çalışmaya hazır olma zamanı</li>
                    <li>Sertifika bilgileri (varsa)</li>
                    <li>Ek notlar (kullanıcının girdiği ölçüde)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">C) Teknik Veriler</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
                    <li>IP adresi, cihaz/tarayıcı bilgileri</li>
                    <li>Oturum/çerez kimlikleri</li>
                    <li>Log kayıtları, hata kayıtları, güvenlik kayıtları</li>
                    <li>Site içi tıklama/etkileşim verileri (analitik)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">D) Fotoğraf ve Dosyalar (Opsiyonel)</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
                    <li>Yüklediğiniz profil fotoğrafı (varsa)</li>
                    <li>Fotoğraf üzerinde yapılan teknik iyileştirme çıktıları (varsa)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="verileri-hangi-amaclarla-isliyoruz">
              <h2 className="text-xl font-semibold text-slate-900">3) Verileri Hangi Amaçlarla İşliyoruz?</h2>
              <ul className="mt-3 list-inside list-disc space-y-2 leading-relaxed">
                <li>CV oluşturma ve başvuru akışını yürütmek</li>
                <li>Kullanıcı deneyimini iyileştirmek ve hizmeti sürdürülebilir kılmak</li>
                <li>Dolandırıcılık, kötüye kullanım, yetkisiz erişim ve güvenlik risklerini azaltmak</li>
                <li>Teknik hata tespiti, performans ve kalite geliştirme</li>
                <li>Kullanıcı talebiyle destek sağlamak (teknik destek/iletişim)</li>
                <li>Yasal yükümlülüklere uyum</li>
              </ul>
            </section>

            <section id="hukuki-sebepler">
              <h2 className="text-xl font-semibold text-slate-900">4) Hukuki Sebepler (KVKK/GDPR Yaklaşımı)</h2>
              <p className="mt-3 leading-relaxed">
                Kişisel veriler; ilgili mevzuata uygun şekilde, aşağıdaki hukuki sebeplerden biri veya birkaçına dayanarak işlenebilir:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 leading-relaxed">
                <li>Hizmetin kurulması/ifa edilmesi (CV oluşturma, kullanıcı kayıtları vb.)</li>
                <li>Meşru menfaat (güvenlik, sistem bütünlüğü, dolandırıcılık önleme)</li>
                <li>Açık rıza (zorunlu olmayan çerezler, pazarlama izinleri, opsiyonel özellikler)</li>
                <li>Hukuki yükümlülük (resmî talepler, saklama zorunlulukları)</li>
              </ul>
            </section>

            <section id="verilerin-paylasimi">
              <h2 className="text-xl font-semibold text-slate-900">5) Verilerin Paylaşımı (Kimlerle, Ne Amaçla?)</h2>
              <p className="mt-3 leading-relaxed">
                İlanlar Cebimde; hizmetin sağlanması için zorunlu olduğu ölçüde verileri aşağıdaki taraflarla paylaşabilir:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 leading-relaxed">
                <li>Barındırma/altyapı sağlayıcıları (sunucu, veri tabanı, depolama)</li>
                <li>Ödeme altyapısı sağlayıcıları (ödeme doğrulama ve işlem güvenliği)</li>
                <li>E-posta/iletişim sağlayıcıları (kullanıcıya bilgilendirme/iletim)</li>
                <li>Analitik ve performans sağlayıcıları (anonim/istatistiksel ölçüm)</li>
                <li>Güvenlik hizmet sağlayıcıları (spam/bot engelleme, saldırı tespiti)</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Sınırlama: Paylaşım; yalnızca hizmetin yürütülmesi için gerekli kapsamda ve ilgili tarafların kendi sorumluluk alanlarıyla sınırlı şekilde yapılır.
              </p>
            </section>

            <section id="yurt-disina-veri-aktarimi">
              <h2 className="text-xl font-semibold text-slate-900">6) Yurt Dışına Veri Aktarımı</h2>
              <p className="mt-3 leading-relaxed">
                Kullandığımız bazı altyapı/analitik/depolama hizmetleri yurt dışında konumlanan sunucular üzerinden çalışabilir. Bu durumda veriler, mevzuata uygun güvenlik önlemleri ve sözleşmesel tedbirler çerçevesinde yurt dışına aktarılabilir.
              </p>
            </section>

            <section id="veri-guvenligi">
              <h2 className="text-xl font-semibold text-slate-900">7) Veri Güvenliği</h2>
              <p className="mt-3 leading-relaxed">
                Veri güvenliği için makul idari ve teknik tedbirler uygulanır:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 leading-relaxed">
                <li>Yetkilendirme ve erişim kontrolleri</li>
                <li>Kayıt ve izleme (log) mekanizmaları</li>
                <li>Şifreleme/maskeleme gibi uygun güvenlik önlemleri (uygulanabildiği ölçüde)</li>
                <li>Sistem güncelleme, zafiyet yönetimi, kötüye kullanım tespiti</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Ancak: İnternet tabanlı sistemlerde %100 güvenlik garanti edilemez. Tüm önlemlere rağmen; siber saldırı, teknik arıza, altyapı kesintisi, üçüncü taraf kaynaklı ihlal veya öngörülemeyen olaylar nedeniyle veri güvenliği riske girebilir.
              </p>
            </section>

            <section id="sorumlulugun-sinirlandirilmasi">
              <h2 className="text-xl font-semibold text-slate-900">8) Sorumluluğun Sınırlandırılması (Çok Önemli)</h2>
              <ul className="mt-3 space-y-3 leading-relaxed">
                <li>Site ve hizmetler “olduğu gibi” sunulur.</li>
                <li>İlanlar Cebimde; iş bulma, işe kabul, vize/oturum izni, kesin sonuç taahhüt etmez.</li>
                <li>Kullanıcı tarafından girilen bilgilerin doğruluğu kullanıcının sorumluluğundadır. Yanlış/eksik beyanlardan doğabilecek sonuçlardan İlanlar Cebimde sorumlu tutulamaz.</li>
                <li>Teknik arıza, bakım, güncelleme, kesinti, veri kaybı, gecikme, erişim sorunları ve benzeri durumlarda; mevzuatın izin verdiği azami ölçüde İlanlar Cebimde'nin sorumluluğu sınırlandırılmıştır.</li>
                <li>Üçüncü taraf servislerin (altyapı, ödeme, analitik vb.) kesintisi/arıza/ihlalinden kaynaklanan sonuçlarda, İlanlar Cebimde'nin sorumluluğu ilgili mevzuat çerçevesinde sınırlıdır.</li>
              </ul>
            </section>

            <section id="saklama-sureleri">
              <h2 className="text-xl font-semibold text-slate-900">9) Saklama Süreleri</h2>
              <p className="mt-3 leading-relaxed">
                Kişisel veriler, işleme amacının gerektirdiği süre boyunca saklanır. Süre sonunda; mevzuatta zorunlu saklama yükümlülüğü yoksa silme, yok etme veya anonim hale getirme yöntemleri uygulanır.
              </p>
            </section>

            <section id="kullanici-haklari">
              <h2 className="text-xl font-semibold text-slate-900">10) Kullanıcı Hakları</h2>
              <p className="mt-3 leading-relaxed">
                Mevzuat kapsamındaki haklarınızı kullanmak için bizimle iletişime geçebilirsiniz. Talebiniz, kimlik doğrulaması sonrasında ve yasal süreler içinde yanıtlanır.
              </p>
            </section>

            <section id="cocuklarin-gizliligi">
              <h2 className="text-xl font-semibold text-slate-900">11) Çocukların Gizliliği</h2>
              <p className="mt-3 leading-relaxed">
                Hizmetler, kural olarak reşit olmayanlara yönelik değildir. Reşit olmayanlara ait veri işlendiğinin tespiti halinde, uygun aksiyon alınabilir.
              </p>
            </section>

            <section id="politika-guncellemeleri">
              <h2 className="text-xl font-semibold text-slate-900">12) Politika Güncellemeleri</h2>
              <p className="mt-3 leading-relaxed">
                Gizlilik Politikası; yasal düzenlemeler ve hizmet değişiklikleri doğrultusunda güncellenebilir. Güncel metin Site'de yayımlandığı anda yürürlüğe girer.
              </p>
            </section>

            <section id="iletisim">
              <h2 className="text-xl font-semibold text-slate-900">13) İletişim</h2>
              <p className="mt-3 leading-relaxed">
                Gizlilik ve veri işleme konularında:
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
