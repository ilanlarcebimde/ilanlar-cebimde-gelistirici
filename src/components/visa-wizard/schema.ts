import { z } from "zod";

export const visaTypeValues = ["work", "tourist", "family", "student", "unsure"] as const;
export const timelineValues = ["immediately", "within_1_month", "within_3_months", "info_only"] as const;
export const contactChannelValues = ["whatsapp", "phone", "email"] as const;

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const textOptional = z.preprocess(emptyToUndefined, z.string().optional());
const intOptional = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}, z.number().int().nonnegative().optional());

export const visaLeadSchema = z.object({
  visaType: z.enum(visaTypeValues, { message: "Vize türü seçin." }),
  targetCountry: z.string().min(2, "Hedef ülke gerekli."),
  applicationGoal: z.string().min(2, "Başvuru amacı gerekli."),
  applicationTimeline: z.enum(timelineValues, { message: "Başvuru zamanı seçin." }),

  fullName: z.string().min(3, "Ad Soyad gerekli."),
  phone: z.string().min(8, "Telefon gerekli."),
  whatsapp: textOptional,
  email: z.string().email("Geçerli e-posta girin."),
  age: intOptional,
  city: z.string().min(2, "Şehir gerekli."),
  nationality: z.string().min(2, "Uyruk gerekli."),

  profession: textOptional,
  experienceYears: intOptional,
  abroadExperience: z.boolean().optional(),
  languageLevel: textOptional,
  hasCv: z.boolean().optional(),
  hasJobOffer: z.boolean().optional(),

  travelDuration: textOptional,
  hasInvitation: z.boolean().optional(),
  hasAccommodationPlan: z.boolean().optional(),

  familyRelation: textOptional,
  spouseCountry: textOptional,
  officialMarriage: z.boolean().optional(),
  spouseResidencyStatus: textOptional,

  schoolAcceptance: z.boolean().optional(),
  schoolProgram: textOptional,
  educationBudget: textOptional,

  unsureReason: textOptional,

  passportStatus: z.string().min(2, "Pasaport durumu gerekli."),
  passportValidity: textOptional,
  previousRefusal: z.boolean().optional(),
  budgetReady: z.boolean().optional(),
  canFollowProcess: z.boolean().optional(),
  preferredContactChannel: z.enum(contactChannelValues, { message: "İletişim kanalı seçin." }),

  supportNeed: z.string().min(5, "Destek beklentinizi yazın."),
  consultantNoteForCall: textOptional,

  consentDataShare: z.boolean().refine((v) => v, "Onay zorunludur."),
  consentContact: z.boolean().refine((v) => v, "Onay zorunludur."),
  consentAccuracy: z.boolean().refine((v) => v, "Onay zorunludur."),
});

export type VisaLeadFormValues = z.infer<typeof visaLeadSchema>;

export const visaLeadPayloadSchema = z.object({
  payload: visaLeadSchema,
});
