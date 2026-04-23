/** Malta listede yok; ilk ülke taban fiyata dahil, sonraki her ülke +89 TL */
export const YURTDISI_BASVURU_BASE_TRY = 199;
export const YURTDISI_BASVURU_EXTRA_COUNTRY_TRY = 89;

export const LISTING_PACKAGES = [
  { id: 3, addTry: 49, label: "3 adet iş ilanı" },
  { id: 6, addTry: 79, label: "6 adet iş ilanı" },
  { id: 9, addTry: 99, label: "9 adet iş ilanı" },
  { id: 15, addTry: 199, label: "15 adet iş ilanı" },
] as const;

export type ListingPackageId = (typeof LISTING_PACKAGES)[number]["id"];

/** İngilizce anahtar → görünen ad (Malta hariç) */
export const EU_COUNTRY_OPTIONS: { key: string; name: string }[] = [
  { key: "austria", name: "Austria" },
  { key: "belgium", name: "Belgium" },
  { key: "bulgaria", name: "Bulgaria" },
  { key: "croatia", name: "Croatia" },
  { key: "cyprus", name: "Cyprus" },
  { key: "czechia", name: "Czechia" },
  { key: "denmark", name: "Denmark" },
  { key: "estonia", name: "Estonia" },
  { key: "finland", name: "Finland" },
  { key: "france", name: "France" },
  { key: "germany", name: "Germany" },
  { key: "greece", name: "Greece" },
  { key: "hungary", name: "Hungary" },
  { key: "iceland", name: "Iceland" },
  { key: "ireland", name: "Ireland" },
  { key: "italy", name: "Italy" },
  { key: "latvia", name: "Latvia" },
  { key: "liechtenstein", name: "Liechtenstein" },
  { key: "lithuania", name: "Lithuania" },
  { key: "luxembourg", name: "Luxembourg" },
  { key: "netherlands", name: "Netherlands" },
  { key: "norway", name: "Norway" },
  { key: "poland", name: "Poland" },
  { key: "portugal", name: "Portugal" },
  { key: "romania", name: "Romania" },
  { key: "slovakia", name: "Slovakia" },
  { key: "slovenia", name: "Slovenia" },
  { key: "spain", name: "Spain" },
  { key: "sweden", name: "Sweden" },
  { key: "switzerland", name: "Switzerland" },
];

const EU_COUNTRY_KEY_SET = new Set(EU_COUNTRY_OPTIONS.map((c) => c.key));

export function isAllowedCountryKey(key: string): boolean {
  return EU_COUNTRY_KEY_SET.has(key);
}

export function countryDisplayName(key: string): string {
  return EU_COUNTRY_OPTIONS.find((c) => c.key === key)?.name ?? key;
}

/**
 * Tek seçim — yüksek talep + ayrıntılı meslek listesi (tümü aynı mantıkla tekil id).
 * id stabil kalmalı (sunucu doğrulaması).
 */
export const PROFESSION_OPTIONS: { id: string; label: string; group: "demand" | "standard" }[] = [
  { id: "demand-warehouse", label: "Depo, lojistik ve mal kabul (yüksek talep)", group: "demand" },
  { id: "demand-hospitality", label: "Otel, catering ve konaklama hizmetleri (yüksek talep)", group: "demand" },
  { id: "demand-construction", label: "İnşaat ve yapı yardımcı personeli (yüksek talep)", group: "demand" },
  { id: "demand-fab", label: "Üretim hattı ve fabrika operatörlüğü (yüksek talep)", group: "demand" },
  { id: "demand-horeca", label: "Gastronomi, mutfak ve servis (yüksek talep)", group: "demand" },
  { id: "demand-clean", label: "Tesis, ofis ve endüstriyel temizlik (yüksek talep)", group: "demand" },
  { id: "demand-health", label: "Bakım, destek ve sağlık tesislerinde yardımcı personel (yüksek talep)", group: "demand" },
  { id: "demand-hvac", label: "Bakım / teknik altyapı destek rolleri (yüksek talep)", group: "demand" },
  { id: "m1", label: "Tarım ve sanayi makineleri: mekanik ve tamircileri", group: "standard" },
  { id: "m2", label: "Ağır kamyon ve tır şoförleri", group: "standard" },
  { id: "m3", label: "Bina ve ilgili elektrikçiler", group: "standard" },
  { id: "m4", label: "Motorlu taşıt tamircileri ve onarıcıları", group: "standard" },
  { id: "m5", label: "Başka yerde sınıflandırılmamış imalat işçileri", group: "standard" },
  { id: "m6", label: "Metal işleme: makine takımı ayarlayıcıları ve operatörleri", group: "standard" },
  { id: "m7", label: "Ofis, otel ve diğer işletmelerde temizlikçiler ve yardımcılar", group: "standard" },
  { id: "m8", label: "Aşçılar", group: "standard" },
  { id: "m9", label: "Tesisatçılar ve boru montajcıları", group: "standard" },
  { id: "m10", label: "Garsonlar", group: "standard" },
  { id: "m11", label: "Marangozlar ve doğramacılar", group: "standard" },
  { id: "m12", label: "Konaklama ve yiyecek hizmeti faaliyetleri", group: "standard" },
  { id: "m13", label: "Tarım, ormancılık ve balıkçılık", group: "standard" },
  { id: "m14", label: "Sanat, eğlence ve dinlenme sektörü rolleri", group: "standard" },
  { id: "m15", label: "İnşaat", group: "standard" },
  { id: "m16", label: "Elektrik, gaz, buhar ve klima temini", group: "standard" },
  { id: "m17", label: "Üretim", group: "standard" },
  { id: "m18", label: "Madencilik ve taş ocağı işletmeciliği", group: "standard" },
  { id: "m19", label: "Ulaşım", group: "standard" },
  { id: "m20", label: "Su temini; kanalizasyon, atık yönetimi ve iyileştirme", group: "standard" },
  { id: "m21", label: "Motorlu taşıt ve motosiklet tamiri", group: "standard" },
  { id: "m22", label: "Berber", group: "standard" },
];

const PROFESSION_ID_SET = new Set(PROFESSION_OPTIONS.map((p) => p.id));

export function isValidProfessionId(id: string | null | undefined): boolean {
  return typeof id === "string" && PROFESSION_ID_SET.has(id);
}

export function professionLabelById(id: string): string {
  return PROFESSION_OPTIONS.find((p) => p.id === id)?.label ?? id;
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
