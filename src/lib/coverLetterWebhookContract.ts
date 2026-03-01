/**
 * İş Başvuru Mektubu — Step 6 webhook sözleşmesi (production-ready).
 * n8n yalnızca bu payload/response formatını bekler; değişiklik yapılmamalı.
 */

/** Step 6'da webhook'a giden payload — tek sefer, n8n'e tek istek. */
export type CoverLetterStep6Payload = {
  intent: "cover_letter_generate";
  session_id: string;
  step: 6;
  approved: boolean;
  locale: string;
  answers: CoverLetterStep6Answers;
  request: { version: 1 };
  /** İlanlı akışta dolu; generic akışta gönderilmez. */
  job?: Record<string, unknown>;
  /** İlanlı akışta mode vb. */
  derived?: Record<string, unknown>;
};

/** Step 6 answers — wizard'dan toplanan alanlar (role Step 1'de, diğerleri 2–5). */
export type CoverLetterStep6Answers = {
  role?: string;
  work_area?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  city_country?: string;
  total_experience_years?: number;
  relevant_experience_years?: number;
  top_skills?: string[];
  last_company?: string;
  passport_status?: string;
  passport_validity_bucket?: string;
  visa_status?: string;
  visa_type?: string;
  work_permit_status?: string;
  work_permit_support_needed?: string;
  documents?: string[];
  availability?: string;
  motivation?: string;
  tone?: string;
  [key: string]: unknown;
};

export const COVER_LETTER_REQUEST_VERSION = 1;

/** n8n başarı cevabı — UI bu yapıyı bekler. */
export type CoverLetterWebhookSuccess = {
  type: "cover_letter";
  status: "success";
  data: {
    turkish_version: string;
    english_version: string;
    ui_notes: {
      tr_notice: string;
      en_notice: string;
    };
  };
};

/** n8n hata cevabı */
export type CoverLetterWebhookError = {
  type: "cover_letter";
  status: "error";
  message: string;
};

export type CoverLetterWebhookResponse = CoverLetterWebhookSuccess | CoverLetterWebhookError;

/** UI'da kullanılan varsayılan notlar; n8n dönmezse fallback. */
export const COVER_LETTER_UI_NOTES = {
  tr_notice:
    "Bu metin sizin okumanız ve incelemeniz için oluşturulmuştur.",
  en_notice:
    "Bu mektubu kopyalayın ve işverenin iletişim bilgisi üzerinden gerekli kanal aracılığıyla iletin (e-posta / başvuru portalı).",
} as const;

/**
 * Step 6 webhook payload'ı üretir (generic veya ilanlı).
 * Sadece bu fonksiyon kullanılsın; alanlar sözleşmeye kilitlenir.
 */
export function buildCoverLetterStep6Payload(params: {
  session_id: string;
  answers: CoverLetterStep6Answers;
  locale?: string;
  job?: Record<string, unknown>;
  derived?: Record<string, unknown>;
}): CoverLetterStep6Payload {
  const {
    session_id,
    answers,
    locale = "tr-TR",
    job,
    derived,
  } = params;
  const payload: CoverLetterStep6Payload = {
    intent: "cover_letter_generate",
    session_id,
    step: 6,
    approved: true,
    locale,
    answers: normalizeStep6Answers(answers),
    request: { version: COVER_LETTER_REQUEST_VERSION },
  };
  if (job) payload.job = job;
  if (derived && Object.keys(derived).length > 0) payload.derived = derived;
  return payload;
}

function normalizeStep6Answers(answers: Record<string, unknown>): CoverLetterStep6Answers {
  const out: CoverLetterStep6Answers = {};
  const keys: (keyof CoverLetterStep6Answers)[] = [
    "role", "work_area", "full_name", "email", "phone", "city_country",
    "total_experience_years", "relevant_experience_years", "top_skills", "last_company",
    "passport_status", "passport_validity_bucket", "visa_status", "visa_type",
    "work_permit_status", "work_permit_support_needed", "documents", "availability",
    "motivation", "tone",
  ];
  for (const k of keys) {
    const v = answers[k];
    if (v !== undefined && v !== null) out[k] = v as never;
  }
  return out;
}

/** n8n response'un success formatında olup olmadığını kontrol eder. */
export function isCoverLetterSuccess(
  data: unknown
): data is CoverLetterWebhookSuccess {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (o.type !== "cover_letter" || o.status !== "success") return false;
  const d = o.data;
  if (!d || typeof d !== "object") return false;
  const d2 = d as Record<string, unknown>;
  return (
    typeof d2.turkish_version === "string" &&
    typeof d2.english_version === "string"
  );
}

/** n8n success dönüşünde ui_notes yoksa varsayılanları doldurur; UI bozulmasın. */
export function ensureCoverLetterResponseUiNotes(webhookData: unknown): unknown {
  if (!isCoverLetterSuccess(webhookData)) return webhookData;
  const data = webhookData.data;
  const ui_notes = data.ui_notes ?? {};
  return {
    ...webhookData,
    data: {
      ...data,
      ui_notes: {
        tr_notice: ui_notes.tr_notice ?? COVER_LETTER_UI_NOTES.tr_notice,
        en_notice: ui_notes.en_notice ?? COVER_LETTER_UI_NOTES.en_notice,
      },
    },
  };
}
