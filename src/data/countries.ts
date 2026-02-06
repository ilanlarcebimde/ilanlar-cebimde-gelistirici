export const COUNTRIES = [
  { id: "de", name: "Almanya", flag: "🇩🇪" },
  { id: "fr", name: "Fransa", flag: "🇫🇷" },
  { id: "nl", name: "Hollanda", flag: "🇳🇱" },
  { id: "at", name: "Avusturya", flag: "🇦🇹" },
  { id: "ch", name: "İsviçre", flag: "🇨🇭" },
  { id: "qa", name: "Katar", flag: "🇶🇦" },
  { id: "ae", name: "Dubai / BAE", flag: "🇦🇪" },
  { id: "sa", name: "Suudi Arabistan", flag: "🇸🇦" },
  { id: "kw", name: "Kuveyt", flag: "🇰🇼" },
  { id: "iq", name: "Irak", flag: "🇮🇶" },
  { id: "ly", name: "Libya", flag: "🇱🇾" },
  { id: "us", name: "ABD / Alaska", flag: "🇺🇸" },
] as const;

export type CountryId = (typeof COUNTRIES)[number]["id"];

export const POPULAR_JOBS_BY_COUNTRY: Record<string, string[]> = {
  de: ["Elektrik Tesisat", "Sıvacılık", "Fayans", "Kaynak", "Betonarme", "Boya"],
  fr: ["Pano Montaj", "Seramik", "PVC Doğrama", "Metal İşleri", "Makine Bakım"],
  nl: ["Elektrik Tesisat", "Sıvacılık", "Fayans", "Kaynak", "Boya", "İzolasyon"],
  at: ["Elektrik", "Tesisat", "Seramik", "Betonarme", "Kaynak"],
  ch: ["Elektrik", "İnşaat", "Metal", "Makine", "Boya"],
  qa: ["MEP", "İnşaat", "Elektrik", "HVAC", "Tesisat"],
  ae: ["MEP", "İnşaat", "Elektrik", "Seramik", "Boya"],
  sa: ["İnşaat", "Elektrik", "Petrol Tesisleri", "Kaynak", "Makine"],
  kw: ["İnşaat", "Elektrik", "Tesisat", "Seramik"],
  iq: ["İnşaat", "Elektrik", "Petrol", "Kaynak", "Tesisat"],
  ly: ["İnşaat", "Elektrik", "Petrol", "Tesisat", "Kaynak"],
  us: ["İnşaat", "Elektrik", "Petrol", "Tesisat", "Kaynak", "HVAC", "Makine"],
};
