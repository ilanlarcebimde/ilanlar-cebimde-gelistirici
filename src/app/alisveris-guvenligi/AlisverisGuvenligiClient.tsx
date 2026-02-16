"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";

const TOC = [
  { id: "genel-guvenlik-yaklasimi", label: "Genel Güvenlik Yaklaşımı" },
  { id: "odeme-guvenligi", label: "Ödeme Güvenliği" },
  { id: "dijital-hizmet-niteligi", label: "Dijital Hizmet Niteliği" },
  { id: "garanti-vermeme", label: "Garanti Vermeme" },
  { id: "sorumluluk-siniri", label: "Sorumluluk Sınırı" },
];

export function AlisverisGuvenligiClient() {
  const router = useRouter();

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <section className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Alışveriş Güvenliği
            </h1>
            <p className="mt-3 text-slate-600">
              Ödeme altyapısı, veri güvenliği ve işlem güvenliği yaklaşımımız.
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
            <section id="genel-guvenlik-yaklasimi">
              <h2 className="text-xl font-semibold text-slate-900">1. Genel Güvenlik Yaklaşımı</h2>
              <p className="mt-3 leading-relaxed">
                İlanlar Cebimde, dijital hizmet sunan bir platformdur. Platform üzerinden gerçekleştirilen ödemeler, güvenli ödeme altyapıları aracılığıyla yürütülür. Kart bilgileriniz doğrudan Platform tarafından saklanmaz; ödeme işlemleri ilgili ödeme kuruluşu altyapısında gerçekleştirilir.
              </p>
              <p className="mt-3 leading-relaxed">
                Platform, kullanıcı bilgilerinin güvenliği için makul teknik ve idari önlemleri uygular.
              </p>
            </section>

            <section id="odeme-guvenligi">
              <h2 className="text-xl font-semibold text-slate-900">2. Ödeme Güvenliği</h2>
              <ul className="mt-3 list-inside list-disc space-y-1 leading-relaxed">
                <li>Ödemeler, güvenli ödeme sağlayıcıları üzerinden gerçekleştirilir.</li>
                <li>Kart bilgileri Platform sunucularında depolanmaz.</li>
                <li>Mükerrer tahsilat veya teknik hata durumları inceleme sonrası değerlendirilir.</li>
                <li>Platform, ödeme altyapısı sağlayıcısının sistem arızası, banka kaynaklı kesinti veya üçüncü taraf güvenlik ihlallerinden doğrudan sorumlu değildir.</li>
              </ul>
            </section>

            <section id="dijital-hizmet-niteligi">
              <h2 className="text-xl font-semibold text-slate-900">3. Dijital Hizmet Niteliği</h2>
              <p className="mt-3 leading-relaxed">
                Platformda sunulan hizmetler dijital içerik ve anında ifa edilen hizmet niteliğindedir.
              </p>
              <p className="mt-3 leading-relaxed">
                CV oluşturma, başvuru düzenleme ve yönlendirme hizmetleri ödeme sonrası başlatılır. Hizmetin niteliği gereği fiziksel teslimat bulunmamaktadır.
              </p>
            </section>

            <section id="garanti-vermeme">
              <h2 className="text-xl font-semibold text-slate-900">4. Garanti Vermeme</h2>
              <p className="mt-3 leading-relaxed">Platform:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 leading-relaxed">
                <li>İşe yerleşme garantisi vermez</li>
                <li>Vize veya çalışma izni garantisi vermez</li>
                <li>İşveren kararlarından sorumlu değildir</li>
                <li>Başvuru sonucuna ilişkin herhangi bir taahhütte bulunmaz</li>
              </ul>
              <p className="mt-3 leading-relaxed">
                Hizmet; düzenleme ve yönlendirme altyapısıdır. Nihai karar üçüncü taraf kurum ve işverenlere aittir.
              </p>
            </section>

            <section id="sorumluluk-siniri">
              <h2 className="text-xl font-semibold text-slate-900">5. Sorumluluk Sınırı</h2>
              <p className="mt-3 leading-relaxed">
                Platformun mali sorumluluğu, ilgili hizmet için ödenen tutarla sınırlıdır.
              </p>
              <p className="mt-3 leading-relaxed">
                Dolaylı zararlar, gelir kaybı, fırsat kaybı, işe kabul edilmeme, vize reddi gibi sonuçlardan Platform sorumlu tutulamaz.
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
