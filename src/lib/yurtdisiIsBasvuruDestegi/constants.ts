/** Malta listede yok; ilk hedef taban fiyata dahil, sonraki her hedef +89 TL */
export const YURTDISI_BASVURU_BASE_TRY = 199;
export const YURTDISI_BASVURU_EXTRA_COUNTRY_TRY = 89;

export const LISTING_PACKAGES = [
  { id: 1, addTry: 0, label: "1 adet iş ilanı" },
  { id: 3, addTry: 49, label: "3 adet iş ilanı" },
  { id: 6, addTry: 79, label: "6 adet iş ilanı" },
  { id: 9, addTry: 99, label: "9 adet iş ilanı" },
  { id: 15, addTry: 199, label: "15 adet iş ilanı" },
] as const;

export type ListingPackageId = (typeof LISTING_PACKAGES)[number]["id"];

export type TargetLocationType = "country" | "region";
export type TargetRegionGroup = "europe" | "international";

/** Tek kaynak: `id` depolama / API ile uyumlu; `key` = `id` (geriye dönük). */
export type TargetCountryOption = {
  id: string;
  nameTr: string;
  flagEmoji: string;
  group: TargetRegionGroup;
  type: TargetLocationType;
  searchText: string;
  iso2: string;
  key: string;
  name: string;
  flag: string;
  locationType: TargetLocationType;
  region: TargetRegionGroup;
};

function targetCountryRow(input: {
  id: string;
  nameTr: string;
  flagEmoji: string;
  group: TargetRegionGroup;
  type: TargetLocationType;
  searchText: string;
  iso2: string;
}): TargetCountryOption {
  return {
    ...input,
    key: input.id,
    name: input.nameTr,
    flag: input.flagEmoji,
    locationType: input.type,
    region: input.group,
  };
}

function dedupeTargetCountries(rows: TargetCountryOption[]): TargetCountryOption[] {
  const seen = new Set<string>();
  const out: TargetCountryOption[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

const TARGET_COUNTRY_OPTIONS_RAW: TargetCountryOption[] = [
  targetCountryRow({ id: "austria", nameTr: "Avusturya", flagEmoji: "🇦🇹", type: "country", group: "europe", searchText: "avusturya austria", iso2: "AT" }),
  targetCountryRow({ id: "belgium", nameTr: "Belçika", flagEmoji: "🇧🇪", type: "country", group: "europe", searchText: "belcika belgium", iso2: "BE" }),
  targetCountryRow({ id: "bulgaria", nameTr: "Bulgaristan", flagEmoji: "🇧🇬", type: "country", group: "europe", searchText: "bulgaristan", iso2: "BG" }),
  targetCountryRow({ id: "croatia", nameTr: "Hırvatistan", flagEmoji: "🇭🇷", type: "country", group: "europe", searchText: "hirvatistan croatia", iso2: "HR" }),
  targetCountryRow({ id: "cyprus", nameTr: "Kıbrıs", flagEmoji: "🇨🇾", type: "country", group: "europe", searchText: "kibris cyprus", iso2: "CY" }),
  targetCountryRow({ id: "czechia", nameTr: "Çekya", flagEmoji: "🇨🇿", type: "country", group: "europe", searchText: "ceky czech", iso2: "CZ" }),
  targetCountryRow({ id: "denmark", nameTr: "Danimarka", flagEmoji: "🇩🇰", type: "country", group: "europe", searchText: "danimarka denmark", iso2: "DK" }),
  targetCountryRow({ id: "estonia", nameTr: "Estonya", flagEmoji: "🇪🇪", type: "country", group: "europe", searchText: "estonya", iso2: "EE" }),
  targetCountryRow({ id: "finland", nameTr: "Finlandiya", flagEmoji: "🇫🇮", type: "country", group: "europe", searchText: "finlandiya", iso2: "FI" }),
  targetCountryRow({ id: "france", nameTr: "Fransa", flagEmoji: "🇫🇷", type: "country", group: "europe", searchText: "fransa france", iso2: "FR" }),
  targetCountryRow({ id: "germany", nameTr: "Almanya", flagEmoji: "🇩🇪", type: "country", group: "europe", searchText: "almanya germany", iso2: "DE" }),
  targetCountryRow({ id: "greece", nameTr: "Yunanistan", flagEmoji: "🇬🇷", type: "country", group: "europe", searchText: "yunanistan greece", iso2: "GR" }),
  targetCountryRow({ id: "hungary", nameTr: "Macaristan", flagEmoji: "🇭🇺", type: "country", group: "europe", searchText: "macaristan hungary", iso2: "HU" }),
  targetCountryRow({ id: "iceland", nameTr: "İzlanda", flagEmoji: "🇮🇸", type: "country", group: "europe", searchText: "izlanda iceland", iso2: "IS" }),
  targetCountryRow({ id: "ireland", nameTr: "İrlanda", flagEmoji: "🇮🇪", type: "country", group: "europe", searchText: "irlanda ireland", iso2: "IE" }),
  targetCountryRow({ id: "italy", nameTr: "İtalya", flagEmoji: "🇮🇹", type: "country", group: "europe", searchText: "italya italy", iso2: "IT" }),
  targetCountryRow({ id: "latvia", nameTr: "Letonya", flagEmoji: "🇱🇻", type: "country", group: "europe", searchText: "letonya latvia", iso2: "LV" }),
  targetCountryRow({ id: "liechtenstein", nameTr: "Lihtenştayn", flagEmoji: "🇱🇮", type: "country", group: "europe", searchText: "lihtenstayn", iso2: "LI" }),
  targetCountryRow({ id: "lithuania", nameTr: "Litvanya", flagEmoji: "🇱🇹", type: "country", group: "europe", searchText: "litvanya", iso2: "LT" }),
  targetCountryRow({ id: "luxembourg", nameTr: "Lüksemburg", flagEmoji: "🇱🇺", type: "country", group: "europe", searchText: "luksemburg", iso2: "LU" }),
  targetCountryRow({ id: "netherlands", nameTr: "Hollanda", flagEmoji: "🇳🇱", type: "country", group: "europe", searchText: "hollanda netherlands", iso2: "NL" }),
  targetCountryRow({ id: "norway", nameTr: "Norveç", flagEmoji: "🇳🇴", type: "country", group: "europe", searchText: "norvec norway", iso2: "NO" }),
  targetCountryRow({ id: "poland", nameTr: "Polonya", flagEmoji: "🇵🇱", type: "country", group: "europe", searchText: "polonya poland", iso2: "PL" }),
  targetCountryRow({ id: "portugal", nameTr: "Portekiz", flagEmoji: "🇵🇹", type: "country", group: "europe", searchText: "portekiz portugal", iso2: "PT" }),
  targetCountryRow({ id: "romania", nameTr: "Romanya", flagEmoji: "🇷🇴", type: "country", group: "europe", searchText: "romanya romania", iso2: "RO" }),
  targetCountryRow({ id: "slovakia", nameTr: "Slovakya", flagEmoji: "🇸🇰", type: "country", group: "europe", searchText: "slovakya", iso2: "SK" }),
  targetCountryRow({ id: "slovenia", nameTr: "Slovenya", flagEmoji: "🇸🇮", type: "country", group: "europe", searchText: "slovenya", iso2: "SI" }),
  targetCountryRow({ id: "spain", nameTr: "İspanya", flagEmoji: "🇪🇸", type: "country", group: "europe", searchText: "ispanya spain", iso2: "ES" }),
  targetCountryRow({ id: "sweden", nameTr: "İsveç", flagEmoji: "🇸🇪", type: "country", group: "europe", searchText: "isvec sweden", iso2: "SE" }),
  targetCountryRow({ id: "switzerland", nameTr: "İsviçre", flagEmoji: "🇨🇭", type: "country", group: "europe", searchText: "isvicre switzerland", iso2: "CH" }),
  targetCountryRow({
    id: "uae",
    nameTr: "Birleşik Arap Emirlikleri (Dubai / BAE)",
    flagEmoji: "🇦🇪",
    type: "region",
    group: "international",
    searchText: "bae dubai birl arap emirlikleri uae",
    iso2: "AE",
  }),
  targetCountryRow({ id: "qatar", nameTr: "Katar", flagEmoji: "🇶🇦", type: "country", group: "international", searchText: "katar qatar", iso2: "QA" }),
  targetCountryRow({ id: "saudi_arabia", nameTr: "Suudi Arabistan", flagEmoji: "🇸🇦", type: "country", group: "international", searchText: "suudi arabistan", iso2: "SA" }),
  targetCountryRow({ id: "bangkok", nameTr: "Bangkok (Tayland)", flagEmoji: "🇹🇭", type: "region", group: "international", searchText: "bangkok tayland thailand", iso2: "TH" }),
  targetCountryRow({ id: "malaysia", nameTr: "Malezya", flagEmoji: "🇲🇾", type: "country", group: "international", searchText: "malezya malaysia", iso2: "MY" }),
  targetCountryRow({ id: "indonesia", nameTr: "Endonezya", flagEmoji: "🇮🇩", type: "country", group: "international", searchText: "endonezya indonesia", iso2: "ID" }),
  targetCountryRow({ id: "south_korea", nameTr: "Güney Kore", flagEmoji: "🇰🇷", type: "country", group: "international", searchText: "guney kore korea", iso2: "KR" }),
  targetCountryRow({ id: "lebanon", nameTr: "Lübnan", flagEmoji: "🇱🇧", type: "country", group: "international", searchText: "lubnan lebanon", iso2: "LB" }),
  targetCountryRow({ id: "manila", nameTr: "Manila (Filipinler)", flagEmoji: "🇵🇭", type: "region", group: "international", searchText: "manila filipinler philippines", iso2: "PH" }),
];

/** Tek kaynak liste (id tekrarı yok). */
export const TARGET_COUNTRY_OPTIONS: TargetCountryOption[] = dedupeTargetCountries(TARGET_COUNTRY_OPTIONS_RAW);

/** Eski isim: pricing ve import uyumu */
export const EU_COUNTRY_OPTIONS = TARGET_COUNTRY_OPTIONS;

const TARGET_COUNTRY_KEY_SET = new Set(TARGET_COUNTRY_OPTIONS.map((c) => c.id));

export function isAllowedCountryKey(key: string): boolean {
  return TARGET_COUNTRY_KEY_SET.has(key);
}

export function targetMetaByKey(key: string) {
  return TARGET_COUNTRY_OPTIONS.find((c) => c.id === key || c.key === key);
}

/** Bayraksız kısa ad (fatura, JSON). */
export function countryDisplayName(key: string): string {
  const t = targetMetaByKey(key);
  return t?.nameTr ?? t?.name ?? key;
}

export function targetDisplayWithFlag(key: string): string {
  const t = targetMetaByKey(key);
  if (!t) return key;
  return `${t.flagEmoji}\u00A0${t.nameTr}`;
}

const normSearch = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function targetMatchesQuery(key: string, queryRaw: string): boolean {
  const t = targetMetaByKey(key);
  if (!t) return false;
  const q = normSearch(queryRaw.trim());
  if (!q) return true;
  const bag = normSearch(`${t.nameTr} ${t.name} ${t.id} ${t.key} ${t.searchText}`);
  return bag.includes(q);
}

/**
 * Meslek: `demand` = TALEP / yüksek talep rozeti; `standard` = klasik tekil satır.
 * id'ler değiştirilmemeli (sunucu doğrulaması).
 */
export type ProfessionOption =
  | { id: string; group: "standard"; label: string }
  | { id: string; group: "demand"; main: string };

export const PROFESSION_OPTIONS: ProfessionOption[] = [
  { id: "demand-warehouse", group: "demand", main: "Depo, lojistik ve mal kabul" },
  { id: "demand-hospitality", group: "demand", main: "Otel, catering ve konaklama hizmetleri" },
  { id: "demand-construction", group: "demand", main: "İnşaat ve yapı yardımcı personeli" },
  { id: "demand-fab", group: "demand", main: "Üretim hattı ve fabrika operatörlüğü" },
  { id: "demand-horeca", group: "demand", main: "Gastronomi, mutfak ve servis" },
  { id: "demand-clean", group: "demand", main: "Tesis, ofis ve endüstriyel temizlik" },
  { id: "demand-health", group: "demand", main: "Bakım, destek ve sağlık tesislerinde yardımcı personel" },
  { id: "demand-hvac", group: "demand", main: "Bakım / teknik altyapı destek rolleri" },
  { id: "m1", group: "standard", label: "Tarım ve sanayi makineleri: mekanik ve tamircileri" },
  { id: "m2", group: "standard", label: "Ağır kamyon ve tır şoförleri" },
  { id: "m3", group: "standard", label: "Bina ve ilgili elektrikçiler" },
  { id: "m4", group: "standard", label: "Motorlu taşıt tamircileri ve onarıcıları" },
  { id: "m5", group: "standard", label: "Başka yerde sınıflandırılmamış imalat işçileri" },
  { id: "m6", group: "standard", label: "Metal işleme: makine takımı ayarlayıcıları ve operatörleri" },
  { id: "m7", group: "standard", label: "Ofis, otel ve diğer işletmelerde temizlikçiler ve yardımcılar" },
  { id: "m8", group: "standard", label: "Aşçılar" },
  { id: "m9", group: "standard", label: "Tesisatçılar ve boru montajcıları" },
  { id: "m10", group: "standard", label: "Garsonlar" },
  { id: "m11", group: "standard", label: "Marangozlar ve doğramacılar" },
  { id: "m12", group: "standard", label: "Konaklama ve yiyecek hizmeti faaliyetleri" },
  { id: "m13", group: "standard", label: "Tarım, ormancılık ve balıkçılık" },
  { id: "m14", group: "standard", label: "Sanat, eğlence ve dinlenme sektörü rolleri" },
  { id: "m15", group: "standard", label: "İnşaat" },
  { id: "m16", group: "standard", label: "Elektrik, gaz, buhar ve klima temini" },
  { id: "m17", group: "standard", label: "Üretim" },
  { id: "m18", group: "standard", label: "Madencilik ve taş ocağı işletmeciliği" },
  { id: "m19", group: "standard", label: "Ulaşım" },
  { id: "m20", group: "standard", label: "Su temini; kanalizasyon, atık yönetimi ve iyileştirme" },
  { id: "m21", group: "standard", label: "Motorlu taşıt ve motosiklet tamiri" },
  { id: "m22", group: "standard", label: "Berber" },
];

const PROFESSION_ID_SET = new Set(PROFESSION_OPTIONS.map((p) => p.id));

export function isValidProfessionId(id: string | null | undefined): boolean {
  return typeof id === "string" && PROFESSION_ID_SET.has(id);
}

export function professionLabelById(id: string): string {
  const p = PROFESSION_OPTIONS.find((x) => x.id === id);
  if (!p) return id;
  return p.group === "demand" ? `${p.main} (yüksek talep)` : p.label;
}

export function professionSearchableText(p: ProfessionOption): string {
  if (p.group === "demand") return `${p.main} yüksek talep`;
  return p.label;
}

export const DOC_CATEGORY_KEYS = [
  "cv",
  "diploma",
  "myk",
  "ustalik",
  "sgk",
  "cert",
  "passport_doc",
  "other",
] as const;

export type DocCategoryKey = (typeof DOC_CATEGORY_KEYS)[number];

export const DOC_CATEGORY_LABELS: Record<DocCategoryKey, string> = {
  cv: "CV (zorunlu)",
  diploma: "Diploma",
  myk: "MYK belgesi",
  ustalik: "Ustalık belgesi",
  sgk: "SGK dökümü",
  cert: "Sertifikalar",
  passport_doc: "Pasaport kopyası",
  other: "Diğer destekleyici belgeler",
};

export const LEGAL_CONSENT_KEYS = [
  "service_is_process",
  "no_outcome_promise",
  "employer_decision",
  "interview_on_candidate",
  "post_process_on_candidate",
  "visa_authority",
  "info_accuracy",
  "docs_job_application",
  "screenshots_info",
  "payment_scope",
  "distance_and_kvkk",
] as const;

export type LegalConsentKey = (typeof LEGAL_CONSENT_KEYS)[number];

export const LEGAL_CONSENT_GROUPS: {
  id: string;
  title: string;
  lead: string;
  keys: readonly LegalConsentKey[];
}[] = [
  {
    id: "scope",
    title: "Hizmetin kapsamı",
    lead: "Hizmetin niteliği, sonuç beklentisi ve ödeme sınırları.",
    keys: ["service_is_process", "no_outcome_promise", "payment_scope"],
  },
  {
    id: "process",
    title: "Süreç ve sorumluluk",
    lead: "İşveren, mülakat, iletişim ve resmî mercilerle ilgili sınırlar.",
    keys: ["employer_decision", "interview_on_candidate", "post_process_on_candidate", "visa_authority"],
  },
  {
    id: "data",
    title: "Veri ve bilgilendirme",
    lead: "Bilgi doğruluğu, belgeler, paylaşım ve aydınlatma onayları.",
    keys: ["info_accuracy", "docs_job_application", "screenshots_info", "distance_and_kvkk"],
  },
] as const;

/** Sözleşme adımı: kısa başlık + açık metin */
export const LEGAL_CONSENT_COPY: Record<LegalConsentKey, { title: string; body: string }> = {
  service_is_process: {
    title: "Hizmetin niteliği",
    body: "Sunulan hizmetin; başvuru ve süreç yönetimi, bilgilendirme ve düzenleme odağında bir destek hizmeti olduğunu anlıyorum.",
  },
  no_outcome_promise: {
    title: "Sonuç taahhüdü yok",
    body: "İşe yerleşme, teklif alma veya olumlu geri dönüş gibi sonuçların garanti edilmediğini; sonucun çok sayıda faktöre bağlı olduğunu biliyorum.",
  },
  employer_decision: {
    title: "İşveren değerlendirmesi",
    body: "İşverenin değerlendirme, elem, mülakat ve teklif kararlarının yalnızca kendisine ait olduğunu kabul ediyorum.",
  },
  interview_on_candidate: {
    title: "Mülakat ve iletişim",
    body: "Mülakat performansı, iletişim dili, hazırlık ve sunumun tarafıma ait olduğunu; bu alanlarda bireysel sorumluluğumun bulunduğunu biliyorum.",
  },
  post_process_on_candidate: {
    title: "Mülakat sonrası süreç",
    body: "Mülakat ve sonrasındaki takip, tercihlerim ve yanıtlarım da dahil olmak üzere ilgili süreçlerin yönetiminde sorumluluğun bende olduğunu anlıyorum.",
  },
  visa_authority: {
    title: "Resmî kararlar",
    body: "Vize, çalışma izni, oturum ve benzeri resmî konularda nihai kararların yalnızca yetkili kurumlar ve mevzuata bağlı olduğunu kabul ediyorum.",
  },
  info_accuracy: {
    title: "Bilgilerin doğruluğu",
    body: "Paylaştığım bilgilerin doğruluğunun ve güncelliğinin bana ait olduğunu, yanlış veya eksik bilginin sorumluluğunu üstlendiğimi beyan ederim.",
  },
  docs_job_application: {
    title: "Belgelerin işlenmesi",
    body: "Yüklediğim belgelerin iş başvurusu ve süreçle ilgili amaçlarla, gizlilik ve mevzuat çerçevesinde işlenmesine izin veriyorum.",
  },
  screenshots_info: {
    title: "İlan ve kanıt paylaşımı",
    body: "Başvurulan ilanlara ait linklerin ve ekran görüntülerinin bilgilendirme amacıyla tarafıma paylaşılabileceğini kabul ediyorum.",
  },
  payment_scope: {
    title: "Ödeme kapsamı",
    body: "Ödeme bedelinin; seçtiğim paket ve sınırlarla belirli bir hizmet kapsamına ilişkin olduğunu, ek taleplerin ayrı değerlendirmeye tabi olabileceğini anlıyorum.",
  },
  distance_and_kvkk: {
    title: "Mesafeli satış ve aydınlatma",
    body: "Mesafeli hizmet sözleşmesi, ön bilgilendirme, KVKK / aydınlatma metinlerini ve platform düzenini okudum, anladım ve onaylıyorum.",
  },
};

export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Temel", "Orta", "İyi"] as const;
