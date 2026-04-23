"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  LineChart,
  ListChecks,
  MessageSquare,
  Network,
  Scale,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { BasvuruDestegiWizard } from "./basvuru-wizard/BasvuruDestegiWizard";
import { PremiumOnboardingProcessSlider } from "./PremiumOnboardingProcessSlider";

const STEPS = [
  {
    title: "Profiliniz değerlendirilir",
    body: "Deneyim, hedef ülke ve meslek odağınız; başvuru yolunuzu netleştirmek için sınıflandırılır. Bu aşama, sürecinizin yönünü belirler.",
    icon: UserRoundSearch,
  },
  {
    title: "Uygun ilan ve işveren eşleşmeleri hazırlanır",
    body: "Hedefinize uygun fırsatlar önceliklendirilir; yönlendirmeler düzenli ve izlenebilir biçimde paylaşılır.",
    icon: FileSearch,
  },
  {
    title: "Başvuru ve ilk bağlantı süreci yönetilir",
    body: "İlk temas, başvuru akışı ve gerekli bilgilendirmeler kontrollü adımlarla organize edilir; sürpriz ilerleme bırakılmaz.",
    icon: Network,
  },
  {
    title: "Görüşme aşamasına kadar süreç organize edilir",
    body: "Takvim, geri dönüşler ve sonraki adımlar netleştirilir; sizin tarafınızda yapmanız gerekenler şeffaflaştırılır.",
    icon: ListChecks,
  },
] as const;

const SCOPE_IN = [
  "Hedefe uygun ilan ve fırsat araştırması (önceliklendirme ve yönlendirme)",
  "Başvuru süreç yönetimi: adımlar, zamanlama, kontrol listeleri",
  "İşverenle ilk bağlantı ve iletişim hattının organize edilmesi",
  "Süreç boyunca bilgilendirme; güncellemeleri tek çatıda toplama",
  "Gerekli durumlarda başvuru ve sürece dair belge paylaşım mantığı (kanıt ve kayıt düzeni)",
] as const;

const SCOPE_OUT = [
  "İşe alım veya çalışma sözleşmesi taahhüdü (işveren değerlendirmesi ayrıdır)",
  "Vize, oturum veya çalışma izni gibi resmî sonuç taahhüdü (yetkili kurumlar karar verir)",
  "Mülakat veya değerlendirme sonucu taahhüdü",
  "Resmî makam veya third-party inisiyatifine müdahale iddiası",
  "Sizin yerinize nihai karar vermek; her adımda onay sizde kalır",
] as const;

const TRUST = [
  {
    title: "Şeffaf süreç takibi",
    body: "Süreç adımları sizinle paylaşılır; ilerleme, beklenen aksiyonlar ve sıradaki durum netleşir.",
    icon: LineChart,
  },
  {
    title: "Düzenli bilgilendirme",
    body: "Güncellemeler kontrollü ritimle iletilir; gürültü yaratmadan, neyin ne zaman bekleneceğini anlatır.",
    icon: MessageSquare,
  },
  {
    title: "Kontrollü başvuru yönetimi",
    body: "Paralel başvurularda yön ve öncelik konusunda düzen; acele değil, planlı ilerleme.",
    icon: Activity,
  },
  {
    title: "Premium süreç kurgusu",
    body: "Profesyonel dokunuş, tutarlı iletişim dili ve işveren tarafıyla ilk temasa uygun kurgu.",
    icon: Sparkles,
  },
] as const;

const AUDIENCE = [
  { title: "Yurtdışında iş arayanlar", body: "Hedef net olsun veya hâlâ şekilleniyor olsun; yolu düzenli biçimde ilerletmek isteyen adaylar." },
  { title: "Başvuru sürecini tek başına yürütmekte zorlananlar", body: "Zaman, dil ve adımlar arasında kalmak yerine, sürece profesyonel bir iskelet koymak isteyenler." },
  { title: "İşverenlere daha düzenli ulaşmak isteyenler", body: "İlk temas, geri dönüş ve sonraki adımlarda daha kurumsal bir izlenim bırakmak isteyen adaylar." },
  { title: "Süreci disiplinli ve üst seviye yürütmek isteyenler", body: "Takip, kayıt ve ilerleme hissi; “ne oldu, sırada ne var?” sorusuna net cevap arayanlar." },
] as const;

const LEGAL_LINES = [
  "Bu hizmet işe yerleştirme veya resmî süreçlerde kesin sonuç iddiası taşımaz. Sunulan yapı, başvuru ve süreç yönetimi desteğidir.",
  "İşverenin değerlendirme, mülakat veya teklif kararı yalnızca ilgili işverenin inisiyatifine aittir.",
  "Mülakat performansı, iletişim dili ve kişisel sunum; adayın sorumluluğundadır. Platform bu alanlarda yönlendirme ve düzenleme sağlayabilir, sonuç iddia etmez.",
  "Vize, çalışma izni, oturum ve benzeri resmî süreçler; ilgili ülke mevzuatı ve yetkili kurumların değerlendirmesine bağlıdır.",
] as const;

const HERO_TRUST = [
  "Sonuç taahhüdü verilmez",
  "Başvuru ve süreç yönetimi odağı",
  "Kontrollü ilerleme ve kayıt düzeni",
  "Profesyonel ilerleme modeli",
] as const;

export function YurtdisiIsBasvuruDestegiClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<"ok" | "fail" | null>(null);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    const odeme = searchParams.get("odeme");
    if (odeme === "ok") {
      setPaymentBanner("ok");
      router.replace("/yurtdisi-is-basvuru-destegi", { scroll: false });
    } else if (odeme === "fail") {
      setPaymentBanner("fail");
      router.replace("/yurtdisi-is-basvuru-destegi", { scroll: false });
    }
  }, [searchParams, router]);

  const scrollToId = (id: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#F6F1E8] text-[#0f1a2c] antialiased">
      {paymentBanner === "ok" && (
        <div
          className="border-b border-emerald-500/25 bg-emerald-50/95 px-4 py-3 text-center text-sm text-emerald-950 shadow-sm"
          role="status"
        >
          <p className="font-medium">Ödeme alındı. Başvuru kaydınız oluşturuldu.</p>
          <p className="mt-1 text-xs text-emerald-900/90">
            Sipariş özeti ve durum için{" "}
            <Link href="/panel" className="font-semibold underline underline-offset-2">
              panele
            </Link>{" "}
            gidebilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => setPaymentBanner(null)}
            className="mt-2 text-xs text-emerald-800/90 underline"
          >
            Kapat
          </button>
        </div>
      )}
      {paymentBanner === "fail" && (
        <div
          className="border-b border-amber-500/30 bg-amber-50/95 px-4 py-3 text-center text-sm text-[#0f1a2c] shadow-sm"
          role="alert"
        >
          <p className="font-medium">Ödeme tamamlanamadı veya iptal edildi.</p>
          <p className="mt-1 text-xs text-slate-700">
            Kart veya 3D doğrulamayı kontrol edip yeniden deneyin. Sayfa yenilendiyse sihirbazı açıp bilgilerinizi tekrar girmeniz gerekebilir.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setPaymentBanner(null);
                openModal();
              }}
              className="font-semibold text-amber-900 underline underline-offset-2"
            >
              Ödemeye tekrar git
            </button>
            <button type="button" onClick={() => setPaymentBanner(null)} className="text-slate-600 underline">
              Kapat
            </button>
          </div>
        </div>
      )}
      <section
        className="relative overflow-hidden border-b border-[#0f1a2c]/[0.08] bg-[#0f1a2c] bg-cover bg-right bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(8,16,28,0.78) 0%, rgba(8,16,28,0.68) 45%, rgba(8,16,28,0.78) 100%), url(https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/merkezi-covers/ChatGPT%20Image%2023%20Nis%202026%2001_56_42.png)",
        }}
      >
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-stretch lg:gap-14">
            <div className="relative z-10 lg:col-span-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/90 backdrop-blur-sm sm:text-xs">
                <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                Başvuru &amp; süreç yönetimi
              </p>
              <h1 className="mt-6 font-serif text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-tight text-[#FEFDFB] sm:text-4xl md:text-[2.5rem] md:leading-[1.1]">
                Yurtdışındaki işverenlere ulaşmak artık daha profesyonel
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-[1.75] text-slate-300/95 sm:text-lg">
                Uygun ilanları bulma, başvuru sürecini yönetme ve işveren bağlantısını organize etme aşamalarında size
                düzenli ve profesyonel bir destek sunuyoruz.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
                <button
                  type="button"
                  onClick={() => scrollToId("premium-basvuru-sureci")}
                  className="group inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0f1a2c] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)] ring-1 ring-amber-400/30 transition hover:bg-[#152a3b] sm:w-auto"
                >
                  Başvuru Sürecini İncele
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={openModal}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-amber-400/30 bg-white/[0.04] px-6 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.08] sm:w-auto"
                >
                  Ön Bilgi Al
                </button>
              </div>
              <ul className="mt-10 flex flex-wrap gap-2" aria-label="Güvence noktaları">
                {HERO_TRUST.map((t) => (
                  <li
                    key={t}
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-amber-400/20 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-[#e8e2d6] sm:text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-200/80" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden lg:block lg:col-span-5" aria-hidden />
          </div>
        </div>
      </section>

      <div className="border-b border-[#0f1a2c]/[0.06] bg-gradient-to-b from-[#F6F1E8] to-[#EFE8DC]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <PremiumOnboardingProcessSlider />
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:space-y-24 sm:px-6 sm:py-20 lg:px-8">
        <section id="nasil-calisir" className="scroll-mt-24">
          <div className="text-center sm:mx-auto sm:max-w-3xl">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#0f1a2c] sm:text-3xl md:text-[2.1rem]">
              Nasıl çalışır?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base">
              Dört adımda, başvurunuzun nerede olduğunu anlayabileceğiniz kontrollü bir ilerleme modeli. Her adımda
              bilgilendirme ve düzen; son karar sizde.
            </p>
          </div>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 sm:mt-12 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.title}
                  className="group relative flex flex-col rounded-2xl border border-[#0f1a2c]/[0.08] bg-[#FEFDFB] p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_20px_50px_-28px_rgba(15,23,42,0.2)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className="absolute -top-2.5 left-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-white text-xs font-bold text-[#0f1a2c] shadow-sm"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#0f1a2c] to-[#152a3d] text-amber-200/90 ring-1 ring-amber-400/15">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-bold leading-snug text-[#0f1a2c]">{s.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="hizmet-kapsami" className="scroll-mt-24">
          <h2 className="text-center font-serif text-2xl font-semibold tracking-tight text-[#0f1a2c] sm:text-3xl">
            Hizmet kapsamı
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 sm:mt-4 sm:text-base">
            Net sınırlar, güvenilir beklenti. Aşağıdaki çerçeve; hem ne aldığınızı hem de neyin dışarıda kaldığını açıkça
            anlatır.
          </p>
          <div className="mt-10 grid gap-5 lg:mt-12 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#0f1a2c]/[0.08] bg-[#FEFDFB] p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.18)] sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-b from-[#0f1a2c] to-[#152a3d] text-white ring-1 ring-amber-400/20">
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-[#0f1a2c] sm:text-xl">Neler dahil?</h3>
              </div>
              <ul className="mt-6 space-y-3.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {SCOPE_IN.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600/50" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-white to-[#F9F5EF] p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.12)] sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#0f1a2c]/10 bg-white text-[#0f1a2c]">
                  <Scale className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-[#0f1a2c] sm:text-xl">Bu hizmet neleri kapsamaz?</h3>
              </div>
              <ul className="mt-6 space-y-3.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {SCOPE_OUT.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="guven" className="scroll-mt-24">
          <h2 className="text-center font-serif text-2xl font-semibold tracking-tight text-[#0f1a2c] sm:text-3xl">
            Güven ve şeffaflık
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 sm:mt-4 sm:text-base">
            Süreç yönetimi, görünürlükle güçlenir. Kanıt ve bilgilendirme; kontrollü ve ölçülü bir modelle sunulur.
          </p>
          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5">
            {TRUST.map((c) => {
              const I = c.icon;
              return (
                <div
                  key={c.title}
                  className="relative overflow-hidden rounded-2xl border border-[#0f1a2c]/[0.08] bg-[#FEFDFB] p-5 shadow-sm before:pointer-events-none before:absolute before:left-0 before:top-0 before:h-px before:w-full before:bg-gradient-to-r before:from-amber-500/0 before:via-amber-500/40 before:to-amber-500/0 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#0f1a2c] to-[#152a3d] text-amber-200/90 ring-1 ring-amber-400/20">
                      <I className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0f1a2c] sm:text-lg">{c.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{c.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="kimler" className="scroll-mt-24">
          <h2 className="text-center font-serif text-2xl font-semibold tracking-tight text-[#0f1a2c] sm:text-3xl">
            Kimler için uygundur?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 sm:mt-4 sm:text-base">
            Profesyonel disiplin ve kontrollü ilerleme arayan aday profilleri.
          </p>
          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5">
            {AUDIENCE.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl border border-[#0f1a2c]/[0.06] bg-[#FEFDFB] p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/[0.04] text-slate-600">
                    <Briefcase className="h-4 w-4" aria-hidden />
                  </div>
                  <h3 className="text-base font-bold text-[#0f1a2c] sm:text-lg">{a.title}</h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="yasal-cerceve" className="scroll-mt-24">
          <h2 className="text-center font-serif text-2xl font-semibold tracking-tight text-[#0f1a2c] sm:text-3xl">
            Yasal ve şeffaf çerçeve
          </h2>
          <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-[#0f1a2c]/[0.1] bg-gradient-to-b from-[#FEFDFB] to-[#F4ECD9]/40 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.18)] sm:mt-10 sm:p-9">
            <p className="text-sm font-medium text-[#0f1a2c] sm:text-base">Aşağıdaki maddeler, hizmetin sınırlarını kurumsal ve sade biçimde özetler.</p>
            <ul className="mt-5 space-y-3.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              {LEGAL_LINES.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600/50" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-slate-500 sm:text-sm">
              Detaylar ve sözleşme metinleri yayımlandığında aynı çerçeve korunacak; sürpriz iddia eklenmeyecektir.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#0f1a2c] via-[#122032] to-[#152a3d] text-white shadow-[0_32px_80px_-20px_rgba(15,23,42,0.45)] ring-1 ring-amber-400/15">
          <div className="px-6 py-10 sm:px-10 sm:py-12 md:px-12 md:py-14">
            <h2 className="font-serif text-balance text-xl font-semibold leading-snug tracking-tight sm:text-2xl md:text-[1.75rem]">
              Başvuru sürecinizi daha düzenli ve profesyonel yönetmek için ilk adımı atın
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300/95 sm:mt-5 sm:text-base">
              Adım adım başvuru sihirbazı ile tercihlerinizi netleştirip güvenli ödeme altyapısı üzerinden süreci
              başlatabilirsiniz. Tüm aşamalar, mevcut hizmet kapsamı ile tutarlıdır.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={openModal}
                className="group inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-amber-500/90 px-6 py-3 text-[15px] font-semibold text-[#0f1a2c] shadow-lg shadow-black/20 transition hover:bg-amber-400 sm:w-auto"
              >
                Başvuru Alanını Aç
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollToId("hizmet-kapsami")}
                className="text-sm font-medium text-slate-200/90 underline decoration-white/20 underline-offset-[5px] transition hover:text-white"
              >
                Hizmet kapsamını tekrar oku
              </button>
            </div>
          </div>
        </section>
      </div>

      <BasvuruDestegiWizard open={modalOpen} onClose={closeModal} />
    </main>
  );
}
