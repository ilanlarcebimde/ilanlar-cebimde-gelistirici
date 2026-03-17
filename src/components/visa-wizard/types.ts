import type { VisaLeadFormValues } from "./schema";

export type VisaWizardStep =
  | "visaType"
  | "target"
  | "personal"
  | "dynamic"
  | "eligibility"
  | "files"
  | "support"
  | "consent";

export interface VisaWizardFileState {
  passportOrId: File | null;
  cv: File | null;
  diploma: File | null;
  refusalLetter: File | null;
  invitationOrOffer: File | null;
  extras: File[];
}

export interface UploadedFileMeta {
  key: keyof VisaWizardFileState | "extras";
  label: string;
  file: File;
}

export interface LeadSubmitResponse {
  leadId: string;
  leadScore: number;
  leadStatus: "hot" | "warm" | "low" | "weak";
}

export type VisaLeadFormData = VisaLeadFormValues;
