"use client";

type CommunityCard = { name: string; value: string };

const GROUP_CARDS: CommunityCard[] = [
  { name: "Yurtdışı İş İlanları", value: "339.9K" },
  { name: "İnşaat İş İlanları (Yurtiçi & Yurtdışı)", value: "169.5K" },
  { name: "Yurtdışı İş İlanları 2026", value: "21.4K" },
  { name: "Yurtdışı İşçi Alımları", value: "12.2K" },
  { name: "Yurtdışı İş İlanları (Ek Grup)", value: "38K" },
];

const PAGE_CARDS: CommunityCard[] = [
  { name: "Yurtdışı Güncel İş İlanları", value: "36K takipçi" },
  { name: "Yurtdışı Güncel İş İlanları (2026)", value: "12K takipçi" },
];

const BENEFITS = [
  "Günlük yeni ilan ve duyuru akışı",
  "Güvenilir kaynaklardan araştırma ve sınıflandırma",
  "İş arayanlara rehber içerikler ve yönlendirmeler",
] as const;

function renderNameWithParenthesis(name: string) {
  const openIdx = name.indexOf("(");
  if (openIdx === -1) return name;
  const main = name.slice(0, openIdx).trimEnd();
  const sub = name.slice(openIdx).trim();
  return (
    <>
      <span>{main}</span>
      <span className="block">{sub}</span>
    </>
  );
}

function FacebookBrandMark({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl border border-white/70 bg-gradient-to-br from-[#326FD2] to-[#2754A7] text-white shadow-[0_8px_20px_rgba(39,84,167,0.26)] ${
        large ? "h-11 w-11" : "h-7 w-7 rounded-lg"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className={`${large ? "h-5 w-5" : "h-3.5 w-3.5"} fill-current`}>
        <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.6 1.6-1.6h1.3V4.8c-.2 0-.9-.1-1.8-.1-2.7 0-4.1 1.6-4.1 4.4V11H8v3h2.7v7h2.8Z" />
      </svg>
    </span>
  );
}

function CheckIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
      <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current" aria-hidden>
        <path d="M7.7 13.2 4.6 10a1 1 0 1 0-1.4 1.4l3.8 3.8a1 1 0 0 0 1.4 0l8-8A1 1 0 1 0 15 5.8l-7.3 7.4Z" />
      </svg>
    </span>
  );
}

export function HeroCommunityProof() {
  return (
    <section className="border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white py-8 sm:py-10" aria-label="Topluluk Gücümüz">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-[#f7faff] via-white to-[#f5f8fc] p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#2B5DAF]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="flex h-full flex-col">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cfe0fb] bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-[#315f9b] shadow-sm">
                <FacebookBrandMark />
                Facebook Topluluk Ağı
              </span>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                581.000+ kişilik topluluk gücümüz
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Facebook grup ve sayfalarımızda her gün yeni yurtdışı iş ilanları, sektör duyuruları ve başvuru süreçlerine dair önemli bilgileri düzenli olarak paylaşıyoruz.
              </p>

              <ul className="mt-5 space-y-3">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <CheckIcon />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://www.facebook.com/Elemanci22/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2f5fa9] to-[#3f74c4] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(49,95,155,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(49,95,155,0.35)]"
              >
                <FacebookBrandMark />
                Facebook topluluğumuza katıl
              </a>

              <section className="mt-3 rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-5 sm:px-7 sm:py-6">
                <h4 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                  Topluluğumuzda her gün neler paylaşıyoruz?
                </h4>
                <ul className="mt-4 space-y-3 text-lg text-slate-600 sm:text-xl">
                  <li>🔔 Günlük yeni yurtdışı iş ilanları</li>
                  <li>📢 Vize ve çalışma izni duyuruları</li>
                  <li>🧭 Başvuru, CV ve yönlendirme içerikleri</li>
                </ul>
                <a
                  href="https://www.facebook.com/Elemanci22/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex text-base font-semibold text-[#355f9a] transition-colors hover:text-[#274b82] sm:text-lg"
                >
                  👉 Tüm paylaşımları gör →
                </a>
              </section>
            </div>

            <div className="space-y-5">
              <section>
                <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Facebook Gruplarımız
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {GROUP_CARDS.map((card, index) => (
                    <article
                      key={card.name}
                      className={`rounded-2xl border p-4 shadow-[0_6px_16px_rgba(15,23,42,0.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)] ${
                        index === 0 ? "sm:col-span-2" : ""
                      }`}
                      style={
                        index === 0
                          ? {
                              borderColor: "rgba(116, 151, 214, 0.55)",
                              background: "linear-gradient(140deg, rgba(235,242,255,0.95), rgba(255,255,255,0.98))",
                              boxShadow: "0 10px 24px rgba(64, 105, 174, 0.16)",
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FacebookBrandMark />
                          <p className="text-sm font-semibold leading-snug text-slate-700">
                            {renderNameWithParenthesis(card.name)}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-500">
                          GRUP
                        </span>
                      </div>
                      <p className={`mt-2.5 font-extrabold tracking-tight text-slate-900 ${index === 0 ? "text-5xl sm:text-[3rem]" : "text-3xl"}`}>
                        {card.value}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {index === 0 ? "En büyük topluluğumuz" : "aktif üye"}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Facebook Sayfalarımız
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {PAGE_CARDS.map((card, index) => (
                    <article
                      key={`${card.name}-${index}`}
                      className="h-full rounded-xl border border-[#d4e3fb] bg-white/95 p-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex h-full flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2.5">
                            <FacebookBrandMark />
                            <p className="text-sm font-semibold leading-snug text-slate-700 break-words">
                              {card.name}
                            </p>
                          </div>
                          <p className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            SAYFA
                          </p>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900">{card.value}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
