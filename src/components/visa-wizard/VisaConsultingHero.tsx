"use client";

interface VisaConsultingHeroProps {
  onStart: () => void;
}

const STATS = [
  "📂 Dosya kontrollü başvuru",
  "🎯 Uygun danışman eşleştirmesi",
  "⚡ 24 saat içinde ön inceleme",
  "🔒 Güvenli bilgi paylaşımı",
];

export function VisaConsultingHero({ onStart }: VisaConsultingHeroProps) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-sky-50 to-white pt-10 pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            🌍 Bir Hayalin Varsa, Başlamak İçin Doğru Yerdesin
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Vize sürecinizi yalnızca form doldurarak değil, belgeleriniz ve uygunluk durumunuzla birlikte ön değerlendirmeye alıyoruz.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATS.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 shadow-sm sm:text-sm">
                {item}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-500"
          >
            Ücretsiz Danışmanlık Al
          </button>
          <p className="mt-1 text-xs text-slate-500">24 saat içinde danışman atanır</p>
        </div>
      </div>
    </section>
  );
}
