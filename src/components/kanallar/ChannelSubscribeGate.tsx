"use client";

type ChannelSubscribeGateProps = {
  channelName: string;
  channelSlug: string;
  isLoggedIn: boolean;
  onSubscribe: () => void;
  subscribing?: boolean;
};

const TEŞVİK_METNİ = [
  "İlk ve ortaöğretim seviyesinde, inşaattan otelciliğe, tesisatçılıktan marangozluğa kadar 50’den fazla meslek grubu tüm dünyada taranır.",
  "Güvenli iş ilanları seçilir, Türkçeye çevrilir ve sizin için ücretsiz listelenir.",
];

export function ChannelSubscribeGate({
  channelName,
  channelSlug,
  isLoggedIn,
  onSubscribe,
  subscribing = false,
}: ChannelSubscribeGateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-center text-lg font-semibold text-slate-900 sm:text-xl">
          {channelName} ilanlarını görmek için abone olun
        </h2>
        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-slate-600">
          {TEŞVİK_METNİ.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-slate-500">
          Abone olduktan sonra bu kanala ait tüm ilanlar listelenir; sistem aboneliklerinizi hatırlar.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onSubscribe}
            disabled={subscribing}
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {subscribing ? "İşleniyor…" : isLoggedIn ? "Abone ol" : "Giriş yap ve abone ol"}
          </button>
        </div>
      </div>
    </div>
  );
}
