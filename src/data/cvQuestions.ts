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
  /** Chip'ler: Sohbette yalnızca yönlendirme/ipucu; tıklanınca input'a yazılmaz. */
  examples: string[];
  /** Select sorularında seçenek listesi (3–6 adet). */
  options?: string[];
  saveKey: string;
  /** Tek cümle ipucu; sohbette 💡 ile gösterilir. */
  hint?: string;
  /** Form yönteminde zorunlu mu (örn. e-posta formda zorunlu). */
  formRequired?: boolean;
  /** Form yönteminde gösterilecek ipucu (yoksa hint kullanılır). */
  formHint?: string;
}

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
      "Sadece yıl yazabilirsiniz",
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
    question: "Hangi işi yapıyorsunuz? (Mesleğiniz)",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [
      "Günlük yaptığınız işi yazın",
      "Tek cümle yeterli",
      "Resmî unvan şart değil",
      "Usta / yardımcı farkını yazabilirsiniz",
      "Abartılı yazmayın",
    ],
    saveKey: "work.title",
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
    question: "Bu işte genelde neler yaparsınız? (kısa maddeler)",
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
    options: ["İlkokul", "Ortaokul", "Lise", "Meslek lisesi", "Diğer"],
    examples: [
      "Kısa seçim yeterli",
      "Meslek lisesi varsa seçin",
      "Devam ediyorsanız 'Diğer' seçin",
      "Okul adı şart değil",
      "Boş bırakabilirsiniz",
    ],
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
    options: ["Hayır", "Biraz", "Orta", "İyi"],
    examples: [
      "En doğru seviyeyi seçin",
      "Abartmayın",
      "Biraz bile iş görür",
      "İş bulmada avantaj sağlar",
      "Boş bırakabilirsiniz",
    ],
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
    options: ["Yok", "Var (B)", "Var (C)", "Var (Diğer)"],
    examples: [
      "Vardiyalı işler için avantaj olabilir",
      "Bilmiyorsanız boş bırakın",
      "Var ise mutlaka belirtin",
      "Aktif kullanıyorsanız daha iyi",
      "Yanlış yazmayın",
    ],
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
    options: ["Evet (geçerli)", "Hayır", "Yenileme/başvuru aşamasında"],
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
    examples: [
      "Sadece adını yazın",
      "Ustalık/kalfalık belgesi olabilir",
      "İş güvenliği belgesi olabilir",
      "Yoksa boş bırakın",
      "Bilmiyorsanız boş bırakın",
    ],
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
    examples: [
      "İşverenler önem verir",
      "Dürüst cevap verin",
      "Geliştirmek isterim demek sorun değil",
      "Kısa ve net",
      "Boş bırakabilirsiniz",
    ],
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
    options: ["Hayır", "Evet", "Görüşmede konuşmak isterim"],
    examples: [
      "CV'ye yazmak zorunlu değil",
      "Görüşmede konuşmak yaygın",
      "İsterseniz yazmayın",
      "Ülkeye göre değişebilir",
      "Boş bırakabilirsiniz",
    ],
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
      "Önemliyse yazın",
      "Kısa yazın",
      "Uzun açıklama gerekmez",
      "Boş bırakabilirsiniz",
      "Sadece gerçekten önemli olan",
    ],
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

/** saveKey ile değer okur */
export function getAnswerBySaveKey(answers: Record<string, unknown>, saveKey: string): string {
  const keys = saveKey.split(".");
  let current: unknown = answers;
  for (const k of keys) {
    if (current == null || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[k];
  }
  return typeof current === "string" ? current : "";
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

/** Yaygın erkek isimleri (küçük harf) — cinsiyet tahmini için */
const MALE_FIRST_NAMES = new Set([
  "ahmet", "mehmet", "ali", "mustafa", "hüseyin", "hasan", "ibrahim", "ismail", "osman", "yusuf",
  "ömer", "ramazan", "halil", "süleyman", "abdullah", "mahmut", "recep", "salih", "fatih", "emre",
  "can", "burak", "serkan", "murat", "volkan", "onur", "barış", "eren", "koray", "ugur", "uğur",
  "cem", "tolga", "oguz", "oğuz", "berk", "alp", "kaan", "burak", "eren", "yasin", "yasir",
  "muhammet", "muhammed", "adem", "ibrahim", "enver", "celal", "nihat", "orhan", "taner", "turgut",
]);

/** İlk isimden hitap tahmini (Bey/Hanım). */
export function inferHitapFromFullName(fullName: string): "Bey" | "Hanım" {
  const first = fullName.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-zçğıöşü]/gi, "") ?? "";
  return MALE_FIRST_NAMES.has(first) ? "Bey" : "Hanım";
}

/** answers'tan tam ad + tahmin edilen hitap ile görüntü ismi (örn. "Ahmet Bey"). */
export function getDisplayName(answers: Record<string, unknown>): string {
  const fullName = getAnswerBySaveKey(answers, "personal.fullName").trim();
  if (!fullName) return "";
  const firstName = fullName.split(/\s+/)[0] ?? fullName;
  const hitap = inferHitapFromFullName(fullName);
  return `${firstName} ${hitap}`;
}
