import type { DocCategoryKey, LegalConsentKey, ListingPackageId } from "./constants";

export type LanguageRow = { name: string; level: string };

export type UploadedFileRef = {
  path: string;
  originalName: string;
  size: number;
  category: DocCategoryKey;
};

export type BasvuruWizardFormState = {
  fullName: string;
  email: string;
  whatsapp: string;
  hasPassport: boolean | null;
  hasAbroadExperience: boolean | null;
  knowsForeignLanguage: boolean | null;
  languages: LanguageRow[];

  professionId: string | null;
  countryKeys: string[];
  listingPackageId: ListingPackageId | null;

  filesByCategory: Record<DocCategoryKey, UploadedFileRef[]>;

  legal: Record<LegalConsentKey, boolean>;

  /** Fatura: billing ile uyum */
  invoiceFirstName: string;
  invoiceLastName: string;
  invoiceEmail: string;
  invoicePhone: string;
  invoiceTckn: string;
  invoiceCity: string;
  invoiceDistrict: string;
  invoicePostal: string;
  invoiceAddress: string;
  invoiceNote: string;
};

export function emptyBasvuruWizardState(): BasvuruWizardFormState {
  return {
    fullName: "",
    email: "",
    whatsapp: "",
    hasPassport: null,
    hasAbroadExperience: null,
    knowsForeignLanguage: null,
    languages: [],
  professionId: null,
  countryKeys: [],
  listingPackageId: 3,
    filesByCategory: {
      cv: [],
      diploma: [],
      myk: [],
      ustalik: [],
      sgk: [],
      cert: [],
      passport_doc: [],
      other: [],
    },
    legal: {
      service_is_process: false,
      no_outcome_promise: false,
      employer_decision: false,
      interview_on_candidate: false,
      post_process_on_candidate: false,
      visa_authority: false,
      info_accuracy: false,
      docs_job_application: false,
      screenshots_info: false,
      payment_scope: false,
      distance_and_kvkk: false,
    },
    invoiceFirstName: "",
    invoiceLastName: "",
    invoiceEmail: "",
    invoicePhone: "",
    invoiceTckn: "",
    invoiceCity: "",
    invoiceDistrict: "",
    invoicePostal: "",
    invoiceAddress: "",
    invoiceNote: "",
  };
}
