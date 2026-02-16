"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Bu sistem ne işe yarar?",
    a: "İlanlar Cebimde; yurtdışında iş arayan adayların başvurusunu düzenli, anlaşılır ve profesyonel hale getiren bir başvuru altyapısıdır. Bilgilerinizi alır, boşlukları sorun yapmadan düzenler ve sizi başvuruya hazırlar.",
  },
  {
    q: "CV bilgilerimi nasıl alıyorsunuz?",
    a: "Üç yöntem var; aynı sayfada ilerlersiniz: Form ile: 25 soruluk adım adım akış. Sohbet ile: soru-cevap şeklinde hızlı toplama. Sesli asistan ile: konuşarak veya yazarak ilerleme.",
  },
  {
    q: "Form yöntemi neden 25 soru?",
    a: "Çünkü sistem, CV'yi \"rastgele metin\" gibi değil; uluslararası başvuru düzenine göre oluşturur. Bu yüzden ad-soyad, iletişim, deneyim, eğitim, dil, pasaport, vardiya uygunluğu, sertifikalar gibi başlıklar tek tek alınır.",
  },
  {
    q: "Boş bırakırsam sorun olur mu?",
    a: "Hayır. Boş bıraktığınız alanlar CV'de gösterilmez. Zorunlu olanlar yalnızca temel iletişim ve kimlik niteliğindeki alanlardır (ör. ad-soyad, telefon, e-posta, şehir/ülke, meslek).",
  },
  {
    q: "Ülke ve meslek seçimi neden zorunlu?",
    a: "Çünkü ilan eşleştirmesi ve yönlendirme akışı, ülke ve alan seçimine göre çalışır. Ülke + meslek alanı + meslek dalı seçilmeden sonraki adıma geçilmez.",
  },
  {
    q: "Hangi ülkelerde talep daha yoğun?",
    a: (
      <>
        Elinizdeki veri setine göre talep yoğunluğu en yüksek ülkelerden bazıları:
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-slate-600">
          {[
            "Avusturya", "Belçika", "Bulgaristan", "Hırvatistan", "Kıbrıs", "Çekya", "Danimarka", "Estonya", "Finlandiya", "Fransa", "Almanya", "Yunanistan", "Macaristan", "İzlanda", "İrlanda", "İtalya", "Letonya", "Lihtenştayn", "Litvanya", "Lüksemburg", "Malta", "Hollanda", "Norveç", "Polonya", "Portekiz", "Romanya", "Slovakya", "Slovenya", "İspanya", "İsveç", "İsviçre",
            "Arjantin", "Avustralya", "Brezilya", "Kanada", "Hong Kong", "Hindistan", "Meksika", "Yeni Zelanda", "Singapur", "Birleşik Krallık", "Amerika Birleşik Devletleri",
            "Katar", "Suudi Arabistan", "Birleşik Arap Emirlikleri", "Dubai", "Alaska",
          ].map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="mt-2 text-slate-600">
          Bu sayılar, sistemde ülke bazlı tarama/yoğunluk mantığını güçlendirmek için kullanılır. Tüm ülkeler olmalı.
        </p>
      </>
    ),
  },
  {
    q: "Hangi sektörlerde talep daha belirgin?",
    a: (
      <>
        Elinizdeki sektör verilerine göre öne çıkanlar:
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-slate-600">
          {[
            "Konaklama ve yiyecek hizmetleri faaliyetleri",
            "Uluslararası kuruluş ve temsilcilik faaliyetleri",
            "Hanehalklarının işveren olarak faaliyetleri ve kendi kullanımına yönelik mal ve hizmet üretimi",
            "İdari ve destek hizmet faaliyetleri",
            "Tarım, ormancılık ve balıkçılık",
            "Sanat, eğlence ve rekreasyon",
            "İnşaat",
            "Eğitim",
            "Elektrik, gaz, buhar ve iklimlendirme üretimi ve dağıtımı",
            "Finans ve sigorta faaliyetleri",
            "İnsan sağlığı ve sosyal hizmet faaliyetleri",
            "Bilgi ve iletişim",
            "İmalat (Üretim)",
            "Madencilik ve taş ocakçılığı",
            "Diğer hizmet faaliyetleri",
            "Mesleki, bilimsel ve teknik faaliyetler",
            "Kamu yönetimi ve savunma; zorunlu sosyal güvenlik",
            "Gayrimenkul faaliyetleri",
            "Ulaştırma ve depolama",
            "Su temini; kanalizasyon, atık yönetimi ve iyileştirme faaliyetleri",
            "Toptan ve perakende ticaret; motorlu kara taşıtlarının ve motosikletlerin onarımı",
          ].map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-2 text-slate-600">
          Bu dağılım, adayın profilini doğru sektöre oturtmak ve eşleştirmeyi güçlendirmek için önemlidir.
        </p>
      </>
    ),
  },
  {
    q: "İngilizce bilmiyorum, başvuru yapabilir miyim?",
    a: "Evet. Ama yurtdışı başvuruda İngilizce CV çoğu zaman şarttır. Sistem; sizin verdiğiniz bilgileri daha düzenli bir forma taşır ve başvuruya hazır hale getirir.",
  },
  {
    q: "Profil fotoğrafı zorunlu mu?",
    a: "Hayır, opsiyoneldir. Yüklerseniz fotoğrafınız CV'ye daha uygun hale getirilmesi için işlenir (arka plan/ışık/renk düzeltme mantığı).",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Yanıtlarınız kayıt mantığıyla işlenir; sistemin amacı, bilgileri kaybetmeden CV üretim sürecini sürdürülebilir kılmaktır. Ayrıca gereksiz kişisel detaylar (tam adres gibi) özellikle istenmez.",
  },
  {
    q: "1 haftalık ilan eşleştirmesi tam olarak nedir?",
    a: "Seçtiğiniz ülke + meslek alanı üzerinden 1 hafta boyunca uygun ilanlar taranır ve size \"nereden başlayacağım?\" noktasında pratik bir yön verilir. Bu destek ek ücret talep edilmeden sunulur.",
  },
  {
    q: "CV çıktılarını hangi formatta alacağım?",
    a: "Sistem, başvurularda kullanılabilecek şekilde PDF çıktısı mantığıyla ilerler. Amaç; tek dosyada net, düzenli ve paylaşılabilir bir çıktı almaktır.",
  },
  {
    q: "Yanlış bilgi girersem ne olur?",
    a: "İşveren süreçlerinde yanlış bilgi güven kaybı yaratabilir. Bu yüzden sistem sorularda ipucu ve yönlendirme verir; kararsız kaldığınız alanları boş bırakmanız genellikle daha doğrudur.",
  },
  {
    q: "Destek alabilir miyim?",
    a: "Evet. Teknik destek kanalı üzerinden, takıldığınız adımlarda yönlendirme alabilirsiniz (özellikle ödeme, kayıt, çıktı alma, fotoğraf yükleme gibi aşamalarda).",
  },
];

export function SSSPageClient() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
          {/* Hero */}
          <section className="rounded-2xl bg-gradient-to-b from-slate-50/80 to-transparent px-6 py-10 text-center sm:px-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Sıkça Sorulan Sorular
            </h1>
            <p className="mt-3 text-slate-600 sm:text-lg">
              Başvuru sistemi, CV oluşturma süreci ve ilan eşleştirme hakkında en çok merak edilenler.
            </p>
          </section>

          {/* Accordion */}
          <section className="mt-10 space-y-4">
            {FAQ.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={index}
                  layout
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  initial={false}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-6 sm:py-5"
                    aria-expanded={isOpen}
                    aria-controls={`sss-answer-${index}`}
                    id={`sss-question-${index}`}
                  >
                    <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900 sm:text-base">
                      {item.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="shrink-0 text-slate-500"
                    >
                      <ChevronDown className="h-5 w-5" aria-hidden />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`sss-answer-${index}`}
                        role="region"
                        aria-labelledby={`sss-question-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 px-4 pb-4 pt-1 text-sm text-slate-600 sm:px-6 sm:pb-5 sm:pt-2 [overflow-wrap:anywhere]">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </section>

          {/* CTA */}
          <section className="mt-14">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">
                Başvurunu oluşturmaya hazır mısın?
              </h2>
              <p className="mt-2 text-center text-sm text-slate-600">
                CV bilgilerini tamamlayarak başvuru paketini oluşturabilirsin.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/cv"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  CV Bilgilerini Tamamla
                </Link>
              </div>
            </div>
          </section>

          <div className="mt-10">
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
