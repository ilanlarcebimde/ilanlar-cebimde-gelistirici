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
  examples: string[];
  saveKey: string;
  hint?: string;
}

export const CV_QUESTIONS: CVQuestion[] = [
  {
    id: "hitap",
    step: 1,
    question: "Size nasıl hitap etmemi istersiniz? Bey, Hanım ya da sadece isim.",
    type: "select",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Bey", "Hanım", "Sadece isim"],
    saveKey: "personal.hitap",
  },
  {
    id: "full_name",
    step: 2,
    question: "Özgeçmişinizde görünecek tam adınız nedir?",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Ahmet Yılmaz"],
    saveKey: "personal.fullName",
  },
  {
    id: "birth_date",
    step: 3,
    question: "Doğum tarihiniz?",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["1985", "15.03.1985"],
    saveKey: "personal.birthDate",
    hint: "Yıl veya gün.ay.yıl yazabilirsiniz.",
  },
  {
    id: "phone",
    step: 4,
    question: "İletişim için telefon numaranız?",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["+90 532 123 45 67"],
    saveKey: "personal.phone",
  },
  {
    id: "email",
    step: 5,
    question: "E-posta adresiniz?",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["ornek@email.com"],
    saveKey: "personal.email",
  },
  {
    id: "job_title",
    step: 6,
    question: "Meslek unvanınız veya yaptığınız işin adı nedir?",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Elektrik tesisatçı", "Kaynakçı", "Fayans ustası"],
    saveKey: "work.title",
    hint: "Örn: Elektrik tesisat, kaynak, fayans.",
  },
  {
    id: "experience_years",
    step: 7,
    question: "Bu alanda kaç yıllık tecrübeniz var?",
    type: "text",
    required: true,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["1-3 yıl", "3-5 yıl", "5+ yıl", "10 yıl"],
    saveKey: "work.experienceYears",
  },
  {
    id: "work_summary",
    step: 8,
    question: "Kendinizi ve iş tecrübenizi kısaca nasıl özetlersiniz? (1-2 cümle)",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [],
    saveKey: "work.summary",
  },
  {
    id: "current_company",
    step: 9,
    question: "Şu an çalıştığınız veya en son çalıştığınız firma adı?",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["ABC İnşaat", "Serbest"],
    saveKey: "work.currentCompany",
  },
  {
    id: "education",
    step: 10,
    question: "Eğitim durumunuz? (Okul, alan, yıl)",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Lise", "Meslek lisesi - Elektrik 2005"],
    saveKey: "education.primary",
  },
  {
    id: "languages",
    step: 11,
    question: "Konuşabildiğiniz diller ve seviyeleri?",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Türkçe (ana dil)", "İngilizce (orta)"],
    saveKey: "languages",
  },
  {
    id: "driving_license",
    step: 12,
    question: "Ehliyet sınıfınız var mı? Varsa hangisi?",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["B", "B, C1", "Yok"],
    saveKey: "mobility.drivingLicense",
  },
  {
    id: "passport",
    step: 13,
    question: "Pasaportunuz var mı? Geçerli mi?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Evet, geçerli", "Hayır", "Yenileme aşamasında"],
    saveKey: "mobility.passport",
  },
  {
    id: "travel_ready",
    step: 14,
    question: "Yurtdışında çalışmaya ne zaman hazırsınız?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Hemen", "1 ay içinde", "2-3 ay içinde", "Belirsiz"],
    saveKey: "mobility.travelReady",
  },
  {
    id: "shift_work",
    step: 15,
    question: "Vardiyalı veya gece çalışmaya uygun musunuz?",
    type: "select",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Evet", "Hayır", "Kısmen uygun"],
    saveKey: "mobility.shiftWork",
  },
  {
    id: "certificates",
    step: 16,
    question: "Mesleki sertifikalarınız veya eğitimleriniz var mı?",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Kaynak sertifikası", "İSG belgesi"],
    saveKey: "certificates",
  },
  {
    id: "skills",
    step: 17,
    question: "Öne çıkardığınız beceriler neler? (Araç, teknik, yöntem)",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Pano montaj", "TIG kaynak", "PLC"],
    saveKey: "skills",
  },
  {
    id: "references",
    step: 18,
    question: "Referans verebileceğiniz bir eski işveren veya ustabaşı var mı? (İsim, firma, iletişim)",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [],
    saveKey: "references",
  },
  {
    id: "hobbies",
    step: 19,
    question: "CV’de belirtmek istediğiniz hobiler veya uğraşlar? (İsteğe bağlı)",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Futbol", "Okuma", "Atlayabilirsiniz"],
    saveKey: "hobbies",
  },
  {
    id: "additional_info",
    step: 20,
    question: "Eklemek istediğiniz başka bir bilgi var mı?",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [],
    saveKey: "additionalInfo",
  },
  {
    id: "city",
    step: 21,
    question: "Yaşadığınız şehir veya bölge?",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["İstanbul", "Ankara", "İzmir"],
    saveKey: "personal.city",
  },
  {
    id: "address",
    step: 22,
    question: "Adres bilginizi CV’de göstermek ister misiniz? (İsteğe bağlı)",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Evet, yazabilirsiniz", "Hayır", "Sadece şehir"],
    saveKey: "personal.addressPreference",
  },
  {
    id: "target_country",
    step: 23,
    question: "Hangi ülke veya ülkelerde çalışmak istiyorsunuz?",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Almanya", "Hollanda", "Almanya, Avusturya"],
    saveKey: "mobility.targetCountry",
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
    examples: ["Hemen", "2 hafta içinde", "1 ay içinde", "2-3 ay"],
    saveKey: "mobility.earliestStart",
  },
  {
    id: "salary_note",
    step: 25,
    question: "Maaş beklentinizi CV’de veya başvuruda belirtmek ister misiniz? (İsteğe bağlı)",
    type: "text",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: ["Evet", "Hayır", "Görüşmede belirtirim"],
    saveKey: "work.salaryNote",
  },
  {
    id: "final_note",
    step: 26,
    question: "Son olarak eklemek istediğiniz bir cümle var mı?",
    type: "multiline",
    required: false,
    voiceEnabled: true,
    chatEnabled: true,
    formEnabled: true,
    examples: [],
    saveKey: "finalNote",
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
