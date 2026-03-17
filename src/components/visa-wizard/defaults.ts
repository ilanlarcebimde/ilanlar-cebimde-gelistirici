import type { VisaLeadFormValues } from "./schema";
import type { VisaWizardStep } from "./types";

export const VISA_WIZARD_STEPS: VisaWizardStep[] = [
  "visaType",
  "target",
  "personal",
  "dynamic",
  "eligibility",
  "files",
  "support",
  "consent",
];

export const STEP_TITLES: Record<VisaWizardStep, string> = {
  visaType: "Vize Türü",
  target: "Hedef Bilgiler",
  personal: "Kişisel Bilgiler",
  dynamic: "Detay Sorular",
  eligibility: "Uygunluk",
  files: "Dosya Yükleme",
  support: "Destek Notu",
  consent: "Onay",
};

export const VISA_DEFAULT_VALUES: VisaLeadFormValues = {
  visaType: "unsure",
  targetCountry: "",
  applicationGoal: "",
  applicationTimeline: "info_only",
  fullName: "",
  phone: "",
  whatsapp: "",
  email: "",
  age: undefined,
  city: "",
  nationality: "",
  profession: "",
  experienceYears: undefined,
  abroadExperience: false,
  languageLevel: "",
  hasCv: false,
  hasJobOffer: false,
  travelDuration: "",
  hasInvitation: false,
  hasAccommodationPlan: false,
  familyRelation: "",
  spouseCountry: "",
  officialMarriage: false,
  spouseResidencyStatus: "",
  schoolAcceptance: false,
  schoolProgram: "",
  educationBudget: "",
  unsureReason: "",
  passportStatus: "",
  passportValidity: "",
  previousRefusal: false,
  budgetReady: false,
  canFollowProcess: false,
  preferredContactChannel: "whatsapp",
  supportNeed: "",
  consultantNoteForCall: "",
  consentDataShare: false,
  consentContact: false,
  consentAccuracy: false,
};

export const VISA_DRAFT_STORAGE_KEY = "visa_wizard_draft_v1";
