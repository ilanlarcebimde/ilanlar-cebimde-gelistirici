import { z } from "zod";

const textField = z.string().optional().default("");

export const cvExperienceEntrySchema = z.object({
  company: textField,
  countryCity: textField,
  position: textField,
  startDate: textField,
  endDate: textField,
  currentlyWorking: z.boolean().optional().default(false),
  tasks: textField,
  equipments: textField,
  projectType: textField,
});

export const cvEducationEntrySchema = z.object({
  schoolName: textField,
  department: textField,
  level: textField,
  startYear: textField,
  endYear: textField,
  graduationStatus: textField,
});

export const cvCertificateEntrySchema = z.object({
  name: textField,
  number: textField,
  validityDate: textField,
});

export const cvLanguageEntrySchema = z.object({
  language: textField,
  level: textField,
  speaking: textField,
  writing: textField,
  understanding: textField,
});

export const cvReferenceEntrySchema = z.object({
  fullName: textField,
  company: textField,
  title: textField,
  relation: textField,
  phone: textField,
  email: textField,
  countryCity: textField,
  callable: textField,
});

export const cvWizardDataSchema = z.object({
  targetCountry: textField,
  jobAreaId: textField,
  jobTitle: textField,
  roleDescription: textField,
  workingSector: textField,
  preferredWorkEnvironment: textField,

  fullName: textField,
  phone: textField,
  email: textField,
  age: textField,
  city: textField,
  nationality: textField,
  maritalStatus: textField,
  passportStatus: textField,
  drivingLicenseInfo: textField,
  relocationBarrier: textField,
  abroadWorkSuitability: textField,

  experienceYears: textField,
  lastCompany: textField,
  lastPosition: textField,
  mainWorkArea: textField,
  workTasks: textField,
  equipments: textField,
  workAreas: textField,
  technicalProcesses: textField,
  environmentExperience: textField,
  teamworkExperience: textField,
  shiftWorkExperience: textField,

  educationLevel: textField,
  courseTrainings: textField,

  drivingLicense: textField,
  srcInfo: textField,
  psychotechnicInfo: textField,
  journeymanCertificate: textField,
  certificates: textField,
  masterCertificate: textField,
  myk: textField,
  operatorCertificate: textField,
  forkliftCertificate: textField,
  craneCertificate: textField,
  weldingCertificate: textField,
  hygieneCertificate: textField,
  oshCertificate: textField,
  otherCertificates: textField,

  referenceWillingness: textField,
  referenceInfo: textField,
  languages: textField,
  notes: textField,

  canWorkCountries: textField,
  preferredMainCountry: textField,
  shiftPreference: textField,
  overtimeEligible: textField,
  canAcceptAccommodation: textField,
  preferredEnvironmentFlexibility: textField,
  canStartNow: textField,
  availabilityDate: textField,
  salaryExpectation: textField,
  workMode: textField,
  travelBarrier: textField,
  preferredCities: textField,

  workType: textField,
  accommodationAcceptance: textField,
  positionSummary: textField,

  experienceEntries: z.array(cvExperienceEntrySchema).optional().default([]),
  educationEntries: z.array(cvEducationEntrySchema).optional().default([]),
  certificateEntries: z.array(cvCertificateEntrySchema).optional().default([]),
  languageEntries: z.array(cvLanguageEntrySchema).optional().default([]),
  referenceEntries: z.array(cvReferenceEntrySchema).optional().default([]),

  photoUrl: z.string().nullable().optional().default(null),
});

export type CvWizardDataInput = z.infer<typeof cvWizardDataSchema>;

export const cvOrderCreateBodySchema = z.object({
  data: cvWizardDataSchema.optional().default({}),
});

