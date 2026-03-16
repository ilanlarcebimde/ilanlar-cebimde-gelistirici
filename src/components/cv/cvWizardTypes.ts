export type CvWizardStep =
  | "target"
  | "personal"
  | "experience"
  | "education"
  | "documents"
  | "languagesReferences"
  | "photo"
  | "preferences"
  | "review";

export interface CvExperienceEntry {
  company: string;
  countryCity: string;
  position: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  tasks: string;
  equipments: string;
  projectType: string;
}

export interface CvEducationEntry {
  schoolName: string;
  department: string;
  level: string;
  startYear: string;
  endYear: string;
  graduationStatus: string;
}

export interface CvCertificateEntry {
  name: string;
  number: string;
  validityDate: string;
}

export interface CvLanguageEntry {
  language: string;
  level: string;
  speaking: string;
  writing: string;
  understanding: string;
}

export interface CvReferenceEntry {
  fullName: string;
  company: string;
  title: string;
  relation: string;
  phone: string;
  email: string;
  countryCity: string;
  callable: string;
}

export interface CvWizardData {
  targetCountry: string;
  jobAreaId: string;
  jobTitle: string;
  roleDescription: string;
  workingSector: string;
  preferredWorkEnvironment: string;

  fullName: string;
  phone: string;
  email: string;
  age: string;
  city: string;
  nationality: string;
  maritalStatus: string;
  passportStatus: string;
  drivingLicenseInfo: string;
  relocationBarrier: string;
  abroadWorkSuitability: string;

  experienceYears: string;
  lastCompany: string;
  lastPosition: string;
  mainWorkArea: string;
  workTasks: string;
  equipments: string;
  workAreas: string;
  technicalProcesses: string;
  environmentExperience: string;
  teamworkExperience: string;
  shiftWorkExperience: string;

  educationLevel: string;
  courseTrainings: string;

  drivingLicense: string;
  srcInfo: string;
  psychotechnicInfo: string;
  journeymanCertificate: string;
  certificates: string;
  masterCertificate: string;
  myk: string;
  operatorCertificate: string;
  forkliftCertificate: string;
  craneCertificate: string;
  weldingCertificate: string;
  hygieneCertificate: string;
  oshCertificate: string;
  otherCertificates: string;

  referenceWillingness: string;
  referenceInfo: string; // backward compatibility
  languages: string; // backward compatibility
  notes: string;

  canWorkCountries: string;
  preferredMainCountry: string;
  shiftPreference: string;
  overtimeEligible: string;
  canAcceptAccommodation: string;
  preferredEnvironmentFlexibility: string;
  canStartNow: string;
  availabilityDate: string;
  salaryExpectation: string;
  workMode: string;
  travelBarrier: string;
  preferredCities: string;

  workType: string;
  accommodationAcceptance: string;
  positionSummary: string;

  experienceEntries: CvExperienceEntry[];
  educationEntries: CvEducationEntry[];
  certificateEntries: CvCertificateEntry[];
  languageEntries: CvLanguageEntry[];
  referenceEntries: CvReferenceEntry[];

  /** Supabase cv-photos bucket'ına yüklenen fotoğrafın public URL'i (varsa) */
  photoUrl: string | null;
}

