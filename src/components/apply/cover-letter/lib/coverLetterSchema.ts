import { z } from "zod";

export type Mode = "job_specific" | "generic";

export const passportStatusSchema = z.enum(["var", "yok", "yenileniyor"]);
export const visaStatusSchema = z.enum(["var", "yok", "başvuracağım"]);
export const workPermitStatusSchema = z.enum(["var", "yok", "başvuracağım"]);
export const availabilitySchema = z.enum(["hemen", "1ay", "2ay", "esnek"]);
export const toneSchema = z.enum(["professional", "very_formal"]);
export const passportValiditySchema = z.enum(["0-6ay", "6-12ay", "12+ay", "bilmiyorum"]);
export const visaTypeSchema = z.enum(["turistik", "calisma", "diger", "bilmiyorum"]);
export const workPermitSupportSchema = z.enum(["evet", "hayir"]);

export const coverLetterAnswersSchema = z.object({
  role: z.string().optional(),
  work_area: z.string().optional(),

  full_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  city_country: z.string().optional(),

  total_experience_years: z.number().optional(),
  relevant_experience_years: z.number().optional(),
  top_skills: z.array(z.string()).optional(),
  last_company: z.string().optional(),

  passport_status: passportStatusSchema.optional(),
  passport_validity_bucket: passportValiditySchema.optional(),
  visa_status: visaStatusSchema.optional(),
  visa_type: visaTypeSchema.optional(),
  work_permit_status: workPermitStatusSchema.optional(),
  work_permit_support_needed: workPermitSupportSchema.optional(),
  documents: z.array(z.string()).optional(),
  availability: availabilitySchema.optional(),

  motivation: z.string().optional(),
  tone: toneSchema.optional(),
});

export type CoverLetterAnswers = z.infer<typeof coverLetterAnswersSchema>;

export type CoverLetterResult = {
  turkish_version: string;
  english_version: string;
  ui_notes?: { tr_notice?: string; en_notice?: string };
};

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type WizardError = {
  code?: string;
  message: string;
};

/** Step 1 (ilanlı): mode required */
export function validateStep1(mode: Mode | undefined): { ok: true } | { ok: false; message: string } {
  if (mode === "job_specific" || mode === "generic") return { ok: true };
  return { ok: false, message: "Bir seçim yapın" };
}

/** Step 1 (genel / ilan bağımsız): role required */
export function validateStep1Generic(answers: CoverLetterAnswers): { ok: true } | { ok: false; message: string } {
  const role = (answers.role ?? "").trim();
  if (!role) return { ok: false, message: "Meslek / rol gereklidir" };
  return { ok: true };
}

/** Step 2: full_name, email required */
export function validateStep2(answers: CoverLetterAnswers): { ok: true } | { ok: false; message: string } {
  const name = (answers.full_name ?? "").trim();
  const email = (answers.email ?? "").trim();
  if (!name) return { ok: false, message: "Ad Soyad gereklidir" };
  if (!email) return { ok: false, message: "E-posta gereklidir" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Geçerli bir e-posta adresi girin" };
  return { ok: true };
}

/** Step 3: total_experience_years, top_skills min 2 */
export function validateStep3(answers: CoverLetterAnswers): { ok: true } | { ok: false; message: string } {
  if (answers.total_experience_years == null) return { ok: false, message: "Toplam deneyim (yıl) gereklidir" };
  const skills = answers.top_skills ?? [];
  if (skills.length < 2) return { ok: false, message: "En az 2 beceri ekleyin" };
  return { ok: true };
}

/** Step 4: passport_status, work_permit_status required */
export function validateStep4(answers: CoverLetterAnswers): { ok: true } | { ok: false; message: string } {
  if (!answers.passport_status) return { ok: false, message: "Pasaport durumu seçin" };
  if (!answers.work_permit_status) return { ok: false, message: "Çalışma izni durumu seçin" };
  return { ok: true };
}

/** Step 5: motivation required, <= 400 chars */
export function validateStep5(answers: CoverLetterAnswers): { ok: true } | { ok: false; message: string } {
  const m = (answers.motivation ?? "").trim();
  if (!m) return { ok: false, message: "Motivasyon metni gereklidir" };
  if (m.length > 400) return { ok: false, message: "400 karakter sınırı" };
  return { ok: true };
}

export function validateStep(step: WizardStep, mode: Mode | undefined, answers: CoverLetterAnswers) {
  switch (step) {
    case 1:
      return validateStep1(mode);
    case 2:
      return validateStep2(answers);
    case 3:
      return validateStep3(answers);
    case 4:
      return validateStep4(answers);
    case 5:
      return validateStep5(answers);
    default:
      return { ok: true as const };
  }
}

export function validateStepGeneric(step: WizardStep, answers: CoverLetterAnswers) {
  switch (step) {
    case 1:
      return validateStep1Generic(answers);
    case 2:
      return validateStep2(answers);
    case 3:
      return validateStep3(answers);
    case 4:
      return validateStep4(answers);
    case 5:
      return validateStep5(answers);
    default:
      return { ok: true as const };
  }
}
