/**
 * Tek soru seti — Sesli, Sohbet ve Form aynı listeyi kullanır.
 * saveKey değerleri profiles.answers içinde nested path (örn. personal.fullName).
 */

export interface CVQuestion {
  id: string;
  step: number;
  question: string;
  type: "text" | "multiline" | "select";
  required: boolean;
  voiceEnabled: boolean;
  chatEnabled: boolean;
  formEnabled: boolean;
  /** Chip'ler / Öneriler: Formda varsayılan kapalı; "Öneriler" ile açılır. Max 4. */
  examples: string[];
  /** Öneriler chip'leri tıklanabilir mi? Default: true. false ise sadece ipucu. */
  examplesClickable?: boolean;
  /** Select sorularında seçenek listesi. "Seçin" placeholder olarak kullanılır, listeye eklenmez. */
  options?: string[];
  saveKey: string;
  hint?: string;
  formRequired?: boolean;
  formHint?: string;
}

/** Form meslek sorusu: 24 meslek + Diğer (profiles.answers'a yazılır). */
export const FORM_PROFESSION_LIST = [
  "Boya ustası", "Çatı ustası", "Montaj ustası", "Fayans ustası", "Duvar ustası", "Elektrik ustası",
  "Kilit taşı ustası", "İnşaat ustası", "Taş ustası", "Motor ustası", "Asansör ustası", "Ahşap doğrama ustası",
  "Ahşap ustası", "Alüminyum doğrama ustası", "Alüminyum küpeşte ustası", "Bobinaj ustası", "Demir doğrama ustası",
  "Duvar kağıdı ustası", "Ferforje ustası", "Börek ustası", "Pasta ustası", "Çikolata ustası", "Döner ustası",
  "Dondurma ustası", "Diğer",
] as const;

export const CV_QUESTIONS: CVQuestion[] = [
  {
    id: "hitap",
    step: 1,
    question: "Size nasıl hitap etmemi istersiniz? Bey, Hanım ya da sadece isim.",
    type: "select",
    required: true,
    voiceEnabled: false,
    chatEnabled: false,
    formEnabled: false,
    examples: ["Bey", "Hanım", "Sadece isim"],
    saveKey: "personal.hitap",
  },
  {
    id: "full_name",
    step: 2,
    question: "Adınız ve soyadınız nedir?",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [
      "Resmî belgelerdeki gibi yazın",
      "Kısaltma kullanmayın",
      "Takma ad yazmayın",
      "Ad + Soyad birlikte olmalı",
      "Türkçe karakter kullanabilirsiniz",
    ],
    saveKey: "personal.fullName",
    hint: "💡 Adınızı kimlik veya pasaportunuzda yazdığı şekilde girin.",
  },
  {
    id: "birth_date",
    step: 3,
    question: "Doğum tarihiniz nedir?",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [
      "Örn: 1978 veya 03.04.1978",
      "Gün.ay.yıl da olur",
      "Yaklaşık yazmayın",
      "Yanlış tarih sorun çıkarabilir",
      "İsterseniz boş bırakın",
    ],
    saveKey: "personal.birthDate",
    hint: "💡 Yıl veya gün.ay.yıl şeklinde yazabilirsiniz.",
  },
  {
    id: "phone",
    step: 4,
    question: "Telefon numaranız nedir?",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [
      "Ülke kodu ile yazın",
      "Aktif kullandığınız numara olsun",
      "WhatsApp kullanılan numara iyi olur",
      "Boşluk koyabilirsiniz",
      "Yanlış numara işverenin ulaşmasını engeller",
    ],
    saveKey: "personal.phone",
    hint: "💡 Ülke kodu ile yazın. Örn: +90...",
  },
  {
    id: "email",
    step: 5,
    question: "E-posta adresinizi girin.",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    formRequired: true,
    formHint: "💡 Geçerli bir e-posta adresi girin.",
    examples: [
      "Aktif kullandığınız adres olsun",
      "Basit ve ciddi bir adres tercih edin",
      "Örn: ad.soyad@email.com",
    ],
    saveKey: "personal.email",
    hint: "💡 E-posta yoksa boş bırakabilirsiniz.",
  },
  {
    id: "city",
    step: 6,
    question: "Şu an nerede yaşıyorsunuz? (Şehir, ülke)",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [
      "Sadece şehir ve ülke yeterli",
      "Mahalle/adres yazmayın",
      "Taşındıysanız günceli yazın",
      "İşveren için önemli bir bilgidir",
      "Kısa yazın",
    ],
    saveKey: "personal.city",
    hint: "💡 Sadece şehir ve ülke yazmanız yeterli.",
  },
  {
    id: "job_title",
    step: 7,
    question: "Mesleğiniz hangisi?",
    type: "select",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: [...FORM_PROFESSION_LIST],
    examples: ["Listeden seçmek daha hızlı", "Diğer ise kısa yaz", "Usta / yardımcı belirt", "Mesleğinize en yakın olanı seçin"],
    saveKey: "work.title",
    formHint: "💡 Listeden seçin; mesleğiniz yoksa «Diğer» seçip kısa yazın.",
    hint: "💡 Günlük yaptığınız işi kısa şekilde yazın.",
  },
  {
    id: "experience_years",
    step: 8,
    question: "Bu işte kaç yıldır çalışıyorsunuz?",
    type: "select",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["0–1 yıl", "1–3 yıl", "3–5 yıl", "5–10 yıl", "10+ yıl"],
    examples: [
      "Yakın olan aralığı seçin",
      "Toplam deneyimi düşünün",
      "Ara verdiyseniz yine toplam yazın",
      "Kesin değilse en yakını seçin",
      "Doğru bilgi iş bulmayı hızlandırır",
    ],
    saveKey: "work.experienceYears",
    hint: "💡 Yakın olan aralığı seçin.",
  },
  {
    id: "work_summary",
    step: 9,
    question: "İş deneyiminizi ekleyin",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [
      "Kısa maddeler yazın",
      "Teknik kelime şart değil",
      "Şantiyede yaptıklarınızı yazın",
      "Ekip işi mi tek başına mı belirtin",
      "Boş bırakabilirsiniz",
    ],
    saveKey: "work.summary",
    hint: "💡 Teknik terim şart değil; kısa ve anlaşılır yazın.",
  },
  {
    id: "current_company",
    step: 10,
    question: "Şu an çalıştığınız veya en son çalıştığınız iş yeri adı nedir?",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [
      "Şirket adını yazabilirsiniz",
      "Bilmiyorsanız boş bırakın",
      "'Serbest' yazabilirsiniz",
      "Ustabaşı/ekip adı yazabilirsiniz",
      "Kısa yeterli",
    ],
    saveKey: "work.currentCompany",
    hint: "💡 Şirket yoksa 'Serbest' yazabilirsiniz.",
  },
  {
    id: "work_sector",
    step: 11,
    question: "Daha çok hangi tür işlerde çalıştınız?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Şantiye / inşaat", "Fabrika / üretim", "Bakım-onarım", "Tadilat / ev işleri", "Depo / lojistik", "Diğer"],
    examples: [
      "En çok çalıştığınız alanı seçin",
      "Birden fazlaysa en baskın olan",
      "Kararsızsanız boş bırakın",
      "İşveren filtrelemesinde kullanılır",
      "Doğru seçmek önemlidir",
    ],
    saveKey: "work.sector",
    hint: "💡 En çok çalıştığınız alanı seçin.",
  },
  {
    id: "education",
    step: 12,
    question: "En son mezun olduğunuz eğitim nedir?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["İlkokul", "Ortaokul", "Lise", "Meslek lisesi", "Ön lisans", "Lisans", "Diğer"],
    examples: ["Okul adını yazmak avantaj", "Yıl bilinmiyorsa boş bırak", "Bölüm varsa ekle", "Kısa tut"],
    formHint: "💡 Seviye seçin; isterseniz okul adı ve mezuniyet yılı ekleyebilirsiniz.",
    saveKey: "education.primary",
    hint: "💡 Kısa seçim yeterli.",
  },
  {
    id: "languages",
    step: 13,
    question: "Yabancı dil biliyor musunuz?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Hayır", "Evet"],
    examples: ["Almanca", "İngilizce", "Orta", "Başlangıç"],
    formHint: "💡 Evet derseniz dil ve seviye ekleyebilirsiniz.",
    saveKey: "languages",
    hint: "💡 En doğru seviyeyi seçin.",
  },
  {
    id: "driving_license",
    step: 14,
    question: "Ehliyetiniz var mı?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Yok", "A1", "A2", "A", "B1", "B", "BE", "C1", "C1E", "C", "CE", "D1", "D1E", "D", "DE", "F", "M", "G", "Diğer"],
    examples: ["Yok", "A1", "A2", "A", "B1", "B", "BE", "C1", "C1E", "C", "CE", "D1", "D1E", "D", "DE", "F", "M", "G", "Diğer"],
    formHint: "💡 Birden fazla sınıf seçebilirsiniz; Diğer seçerseniz kısa açıklayın.",
    saveKey: "mobility.drivingLicense",
    hint: "💡 Varsa en yakın seçeneği seçin.",
  },
  {
    id: "vehicle_usage",
    step: 15,
    question: "Aktif araç kullanabiliyor musunuz?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Evet", "Hayır", "Bazen"],
    examples: [
      "Günlük kullanıyorsanız seçin",
      "Şirket servis/araç işlerinde önemli",
      "Kararsızsanız 'Bazen'",
      "Yalan bilgi vermeyin",
      "Boş bırakabilirsiniz",
    ],
    saveKey: "mobility.vehicleUsage",
    hint: "💡 Günlük araç kullanıyorsanız 'Evet' seçin.",
  },
  {
    id: "passport",
    step: 16,
    question: "Pasaportunuz var mı?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Yok", "Var (geçerli)", "Var (süresi dolmak üzere)"],
    examples: [
      "Varsa belirtmek avantaj",
      "Yoksa sorun değil",
      "Süreçteyseniz söyleyin",
      "Geçerliyse seçin",
      "Boş bırakabilirsiniz",
    ],
    saveKey: "mobility.passport",
    hint: "💡 Yurt dışı için önemli; yoksa sorun değil.",
  },
  {
    id: "travel_ready",
    step: 17,
    question: "Yurt dışında çalışmaya ne zaman hazırsınız?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Hemen", "1 ay içinde", "2–3 ay içinde", "Daha sonra", "Belirsiz"],
    examples: [
      "Gerçekçi olanı seçin",
      "İşveren planı için önemli",
      "Belirsizse 'Belirsiz'",
      "Yakın tarih avantaj olabilir",
      "Boş bırakabilirsiniz",
    ],
    saveKey: "mobility.travelReady",
    hint: "💡 Gerçekçi olanı seçin.",
  },
  {
    id: "shift_work",
    step: 18,
    question: "Vardiyalı veya gece çalışmaya uygun musunuz?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Evet", "Hayır", "Kısmen"],
    examples: [
      "Uygunsanız belirtin",
      "Sağlık durumunuzu düşünün",
      "Kısmen seçeneği var",
      "İşveren için önemli",
      "Boş bırakabilirsiniz",
    ],
    saveKey: "mobility.shiftWork",
    hint: "💡 Uygunsanız belirtmek iş seçeneğini artırır.",
  },
  {
    id: "overtime",
    step: 19,
    question: "Fazla mesai yapabilir misiniz?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Evet", "Hayır", "Duruma göre"],
    examples: [
      "Duruma göre seçeneği var",
      "İş bulmayı kolaylaştırabilir",
      "Gerçekçi olun",
      "Şartlar değişebilir",
      "Boş bırakabilirsiniz",
    ],
    saveKey: "work.overtime",
    hint: "💡 Duruma göre ise 'Duruma göre' seçin.",
  },
  {
    id: "relocation",
    step: 20,
    question: "Gerekirse şehir değiştirebilir misiniz?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Evet", "Hayır", "Duruma göre"],
    examples: [
      "İş seçeneklerini artırır",
      "Aile durumunuza göre seçin",
      "Duruma göre seçeneği var",
      "Gerçekçi olun",
      "Boş bırakabilirsiniz",
    ],
    saveKey: "mobility.relocation",
    hint: "💡 Taşınma durumu iş seçeneklerini etkiler.",
  },
  {
    id: "certificates",
    step: 21,
    question: "Mesleki belgeniz veya sertifikanız var mı?",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["MYK", "Ustalık belgesi", "Hijyen", "İSG"],
    formHint: "💡 Sertifika adı, yıl ve kurum (isterseniz). «Örnekler» butonundan fikir alabilirsiniz.",
    saveKey: "certificates",
    hint: "💡 Varsa sadece adını yazmanız yeterli.",
  },
  {
    id: "safety_compliance",
    step: 22,
    question: "İş güvenliği kurallarına uyum konusunda kendinizi nasıl görürsünüz?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Çok dikkat ederim", "Dikkat ederim", "Geliştirmek isterim"],
    examples: ["Dürüst cevap verin", "Geliştirmek isterim demek sorun değil"],
    formHint: "💡 İşverenler bu konuya önem verir.",
    saveKey: "work.safetyCompliance",
    hint: "💡 İşverenler bu konuya önem verir.",
  },
  {
    id: "target_country",
    step: 23,
    question: "Hangi ülke veya bölgede çalışmak istersiniz?",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [
      "Birden fazla yazabilirsiniz",
      "Öncelik sırasıyla yazın",
      "Gitmeye hazır olduğunuzu yazın",
      "Kararsızsanız boş bırakın",
      "Şehir adı da yazabilirsiniz",
    ],
    saveKey: "mobility.targetCountry",
    hint: "💡 Birden fazla yazabilirsiniz, öncelik sırasıyla.",
  },
  
  {
    id: "earliest_start",
    step: 24,
    question: "En erken ne zaman işe başlayabilirsiniz?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Hemen", "2 hafta içinde", "1 ay içinde", "2–3 ay içinde", "Belirsiz"],
    examples: [
      "Gerçekçi olanı seçin",
      "Yakın başlama avantaj olabilir",
      "Belirsizse 'Belirsiz'",
      "Planınıza göre seçin",
      "Boş bırakabilirsiniz",
    ],
    saveKey: "mobility.earliestStart",
    hint: "💡 Gerçekçi olanı seçin.",
  },
  {
    id: "salary_note",
    step: 25,
    question: "Maaş konusunu CV'de yazmak ister misiniz?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    options: ["Yazmak istemiyorum", "Görüşmede konuşmak istiyorum", "Net maaş yazmak istiyorum", "Maaş aralığı yazmak istiyorum"],
    examples: ["CV'ye yazmak zorunlu değil", "Görüşmede konuşmak yaygın", "Net veya aralık seçebilirsiniz"],
    formHint: "💡 Net veya aralık seçerseniz tutar alanları açılır.",
    saveKey: "work.salaryNote",
    hint: "💡 Genelde CV'ye yazmak zorunlu değildir.",
  },
  {
    id: "final_note",
    step: 26,
    question: "Eklemek istediğiniz başka bir bilgi var mı?",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [
      "Konaklama imkânı olan işleri tercih ederim.",
      "Avans/haftalık ödeme uygunsa değerlendiririm.",
      "Fazla mesaiye uygunum.",
      "Vardiyalı çalışabilirim.",
      "Şehir değişimine uygunum.",
      "Hemen başlayabilirim.",
    ],
    formHint: "💡 İsterseniz önerilerden birini seçip ekleyebilirsiniz.",
    saveKey: "finalNote",
    hint: "💡 Önemli bir şey yoksa boş bırakın.",
  },
];

/** Ülke ve meslek soruları (wizard sonunda ortak) — step 21-23 mantıken */
export const COUNTRY_JOB_STEP = 21;

/** saveKey ile nested objeye değer yazar (örn. "personal.fullName" → answers.personal.fullName) */
export function setAnswerBySaveKey(
  answers: Record<string, unknown>,
  saveKey: string,
  value: string
): Record<string, unknown> {
  return setAnswerBySaveKeyValue(answers, saveKey, value);
}

/** saveKey ile herhangi bir değer yazar (string, array, object). */
export function setAnswerBySaveKeyValue(
  answers: Record<string, unknown>,
  saveKey: string,
  value: unknown
): Record<string, unknown> {
  const keys = saveKey.split(".");
  const out = JSON.parse(JSON.stringify(answers)) as Record<string, unknown>;
  let current = out;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== "object") {
      (current as Record<string, unknown>)[k] = {};
    }
    current = (current as Record<string, unknown>)[k] as Record<string, unknown>;
  }
  (current as Record<string, unknown>)[keys[keys.length - 1]] = value;
  return out;
}

/** saveKey ile değer okur (string). */
export function getAnswerBySaveKey(answers: Record<string, unknown>, saveKey: string): string {
  const v = getAnswerBySaveKeyValue(answers, saveKey);
  return typeof v === "string" ? v : "";
}

/** saveKey ile herhangi bir değer okur (string | array | object). */
export function getAnswerBySaveKeyValue(answers: Record<string, unknown>, saveKey: string): unknown {
  const keys = saveKey.split(".");
  let current: unknown = answers;
  for (const k of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[k];
  }
  return current;
}

/** Select seçeneklerini tekrarsız yapar; boş ve "Seçin" hariç. */
export function dedupeOptions(options: string[]): string[] {
  const seen = new Set<string>();
  return options.filter((o) => {
    const t = o?.trim();
    if (!t || t === "Seçin") return false;
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}

/** Tüm sorular (fotoğraf hariç) — sesli/sohbet/form için filtreler */
export function getQuestionsFor(mode: "voice" | "chat" | "form"): CVQuestion[] {
  return CV_QUESTIONS.filter((q) => {
    if (mode === "voice") return q.voiceEnabled;
    if (mode === "chat") return q.chatEnabled;
    return q.formEnabled;
  });
}

export const TOTAL_QUESTION_STEPS = CV_QUESTIONS.length;

/** Yaygın erkek isimleri (normalize edilmiş küçük harf) — cinsiyet tahmini için */
const MALE_FIRST_NAMES = new Set([
  "ahmet", "mehmet", "ali", "mustafa", "huseyin", "hasan", "ibrahim", "ismail", "osman", "yusuf",
  "omer", "ramazan", "halil", "suleyman", "abdullah", "mahmut", "recep", "salih", "fatih", "emre",
  "can", "burak", "serkan", "murat", "volkan", "onur", "baris", "eren", "koray", "ugur",
  "cem", "tolga", "oguz", "berk", "alp", "kaan", "yasin", "yasir",
  "muhammet", "muhammed", "adem", "enver", "celal", "nihat", "orhan", "taner", "turgut",
  "bugra", "kerem", "berkay", "efe", "emir", "kadir", "halil", "yasin", "yusuf", "enes",
  "arda", "burak", "deniz", "mert", "batuhan", "berke", "kutay", "alp", "kaan", "efe",
  "oguzhan", "gokhan", "yilmaz", "ilker", "sinan", "selim", "ferhat", "gurkan",
]);

/** İsim karşılaştırması için normalize: ğ→g, ı→i, ö→o, ü→u, ş→s, ç→c */
function normalizeNameForHitap(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/i/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/[^a-z]/g, "");
}

/** İlk isimden hitap tahmini (Bey/Hanım). */
export function inferHitapFromFullName(fullName: string): "Bey" | "Hanım" {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  const normalized = normalizeNameForHitap(first);
  if (!normalized) return "Hanım";
  return MALE_FIRST_NAMES.has(normalized) ? "Bey" : "Hanım";
}

/** answers'tan tam ad + hitap ile görüntü ismi (örn. "Ahmet Bey"). Kayıtlı personal.hitap yoksa isimden tahmin edilir. */
export function getDisplayName(answers: Record<string, unknown>): string {
  const fullName = getAnswerBySaveKey(answers, "personal.fullName").trim();
  if (!fullName) return "";
  const firstName = fullName.split(/\s+/)[0] ?? fullName;
  const savedHitap = getAnswerBySaveKey(answers, "personal.hitap").trim();
  const hitap =
    savedHitap === "Bey" || savedHitap === "Hanım"
      ? savedHitap
      : inferHitapFromFullName(fullName);
  return `${firstName} ${hitap}`;
}
