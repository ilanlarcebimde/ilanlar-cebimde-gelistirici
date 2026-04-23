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

/** Tek kaynak: anahtarlar eski ve yeni depolarla uyumlu kalmalı (sunucu doğrulaması). */
export const TARGET_COUNTRY_OPTIONS: {
  key: string;
  name: string;
  /** Bayrak (emoji) + arama yordamı */
  flag: string;
  locationType: TargetLocationType;
  region: TargetRegionGroup;
  /** Araya: dubai, thailand, filipin … */
  searchText: string;
}[] = [
  { key: "austria", name: "Avusturya", flag: "🇦🇹", locationType: "country", region: "europe", searchText: "avusturya austria" },
  { key: "belgium", name: "Belçika", flag: "🇧🇪", locationType: "country", region: "europe", searchText: "belcika belgium" },
  { key: "bulgaria", name: "Bulgaristan", flag: "🇧🇬", locationType: "country", region: "europe", searchText: "bulgaristan" },
  { key: "croatia", name: "Hırvatistan", flag: "🇭🇷", locationType: "country", region: "europe", searchText: "hirvatistan croatia" },
  { key: "cyprus", name: "Kıbrıs", flag: "🇨🇾", locationType: "country", region: "europe", searchText: "kibris cyprus" },
  { key: "czechia", name: "Çekya", flag: "🇨🇿", locationType: "country", region: "europe", searchText: "ceky czech" },
  { key: "denmark", name: "Danimarka", flag: "🇩🇰", locationType: "country", region: "europe", searchText: "danimarka denmark" },
  { key: "estonia", name: "Estonya", flag: "🇪🇪", locationType: "country", region: "europe", searchText: "estonya" },
  { key: "finland", name: "Finlandiya", flag: "🇫🇮", locationType: "country", region: "europe", searchText: "finlandiya" },
  { key: "france", name: "Fransa", flag: "🇫🇷", locationType: "country", region: "europe", searchText: "fransa france" },
  { key: "germany", name: "Almanya", flag: "🇩🇪", locationType: "country", region: "europe", searchText: "almanya germany" },
  { key: "greece", name: "Yunanistan", flag: "🇬🇷", locationType: "country", region: "europe", searchText: "yunanistan greece" },
  { key: "hungary", name: "Macaristan", flag: "🇭🇺", locationType: "country", region: "europe", searchText: "macaristan hungary" },
  { key: "iceland", name: "İzlanda", flag: "🇮🇸", locationType: "country", region: "europe", searchText: "izlanda iceland" },
  { key: "ireland", name: "İrlanda", flag: "🇮🇪", locationType: "country", region: "europe", searchText: "irlanda ireland" },
  { key: "italy", name: "İtalya", flag: "🇮🇹", locationType: "country", region: "europe", searchText: "italya italy" },
  { key: "latvia", name: "Letonya", flag: "🇱🇻", locationType: "country", region: "europe", searchText: "letonya latvia" },
  { key: "liechtenstein", name: "Lihtenştayn", flag: "🇱🇮", locationType: "country", region: "europe", searchText: "lihtenstayn" },
  { key: "lithuania", name: "Litvanya", flag: "🇱🇹", locationType: "country", region: "europe", searchText: "litvanya" },
  { key: "luxembourg", name: "Lüksemburg", flag: "🇱🇺", locationType: "country", region: "europe", searchText: "luksemburg" },
  { key: "netherlands", name: "Hollanda", flag: "🇳🇱", locationType: "country", region: "europe", searchText: "hollanda netherlands" },
  { key: "norway", name: "Norveç", flag: "🇳🇴", locationType: "country", region: "europe", searchText: "norvec norway" },
  { key: "poland", name: "Polonya", flag: "🇵🇱", locationType: "country", region: "europe", searchText: "polonya poland" },
  { key: "portugal", name: "Portekiz", flag: "🇵🇹", locationType: "country", region: "europe", searchText: "portekiz portugal" },
  { key: "romania", name: "Romanya", flag: "🇷🇴", locationType: "country", region: "europe", searchText: "romanya romania" },
  { key: "slovakia", name: "Slovakya", flag: "🇸🇰", locationType: "country", region: "europe", searchText: "slovakya" },
  { key: "slovenia", name: "Slovenya", flag: "🇸🇮", locationType: "country", region: "europe", searchText: "slovenya" },
  { key: "spain", name: "İspanya", flag: "🇪🇸", locationType: "country", region: "europe", searchText: "ispanya spain" },
  { key: "sweden", name: "İsveç", flag: "🇸🇪", locationType: "country", region: "europe", searchText: "isvec sweden" },
  { key: "switzerland", name: "İsviçre", flag: "🇨🇭", locationType: "country", region: "europe", searchText: "isvicre switzerland" },
  { key: "uae", name: "Birleşik Arap Emirlikleri (Dubai / BAE)", flag: "🇦🇪", locationType: "region", region: "international", searchText: "bae dubai birl arap emirlikleri uae" },
  { key: "qatar", name: "Katar", flag: "🇶🇦", locationType: "country", region: "international", searchText: "katar qatar" },
  { key: "saudi_arabia", name: "Suudi Arabistan", flag: "🇸🇦", locationType: "country", region: "international", searchText: "suudi arabistan" },
  { key: "bangkok", name: "Bangkok (Tayland)", flag: "🇹🇭", locationType: "region", region: "international", searchText: "bangkok tayland thailand" },
  { key: "malaysia", name: "Malezya", flag: "🇲🇾", locationType: "country", region: "international", searchText: "malezya malaysia" },
  { key: "indonesia", name: "Endonezya", flag: "🇮🇩", locationType: "country", region: "international", searchText: "endonezya indonesia" },
  { key: "south_korea", name: "Güney Kore", flag: "🇰🇷", locationType: "country", region: "international", searchText: "guney kore korea" },
  { key: "lebanon", name: "Lübnan", flag: "🇱🇧", locationType: "country", region: "international", searchText: "lubnan lebanon" },
  { key: "manila", name: "Manila (Filipinler)", flag: "🇵🇭", locationType: "region", region: "international", searchText: "manila filipinler philippines" },
];

/** Eski isim: pricing ve import uyumu */
export const EU_COUNTRY_OPTIONS = TARGET_COUNTRY_OPTIONS;

const TARGET_COUNTRY_KEY_SET = new Set(TARGET_COUNTRY_OPTIONS.map((c) => c.key));

export function isAllowedCountryKey(key: string): boolean {
  return TARGET_COUNTRY_KEY_SET.has(key);
}

export function targetMetaByKey(key: string) {
  return TARGET_COUNTRY_OPTIONS.find((c) => c.key === key);
}

/** Bayraksız kısa ad (fatura, JSON). */
export function countryDisplayName(key: string): string {
  return targetMetaByKey(key)?.name ?? key;
}

export function targetDisplayWithFlag(key: string): string {
  const t = targetMetaByKey(key);
  if (!t) return key;
  return `${t.flag}\u00A0${t.name}`;
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
  const bag = normSearch(`${t.name} ${t.key} ${t.searchText}`);
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
