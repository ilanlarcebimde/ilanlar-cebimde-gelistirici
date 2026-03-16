"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { COUNTRIES } from "@/data/countries";
import { PROFESSION_AREAS } from "@/data/professions";
import { PhotoUpload } from "@/components/wizard/PhotoUpload";
import type {
  CvWizardStep,
  CvWizardData,
  CvExperienceEntry,
  CvEducationEntry,
  CvCertificateEntry,
  CvLanguageEntry,
  CvReferenceEntry,
} from "./cvWizardTypes";
import { readCvWizardDraft, useCvWizardAutosave } from "./useCvWizardAutosave";

const LEGACY_STEPS: CvWizardStep[] = ["target", "personal", "experience", "documents", "photo", "preferences", "review"];
const STEPS_V2: CvWizardStep[] = [
  "target",
  "personal",
  "experience",
  "education",
  "documents",
  "languagesReferences",
  "photo",
  "preferences",
  "review",
];
const STEPS: CvWizardStep[] = STEPS_V2.length ? STEPS_V2 : LEGACY_STEPS;
const STEP_LABELS: Record<CvWizardStep, string> = {
  target: "Hedef ülke",
  personal: "Kişisel",
  experience: "Deneyim",
  education: "Eğitim",
  documents: "Belgeler",
  languagesReferences: "Dil/Referans",
  photo: "Fotoğraf",
  preferences: "Tercihler",
  review: "Kontrol",
};

const EMPTY_EXPERIENCE: CvExperienceEntry = {
  company: "",
  countryCity: "",
  position: "",
  startDate: "",
  endDate: "",
  currentlyWorking: false,
  tasks: "",
  equipments: "",
  projectType: "",
};

const EMPTY_EDUCATION: CvEducationEntry = {
  schoolName: "",
  department: "",
  level: "",
  startYear: "",
  endYear: "",
  graduationStatus: "",
};

const EMPTY_CERTIFICATE: CvCertificateEntry = {
  name: "",
  number: "",
  validityDate: "",
};

const EMPTY_LANGUAGE: CvLanguageEntry = {
  language: "",
  level: "",
  speaking: "",
  writing: "",
  understanding: "",
};

const EMPTY_REFERENCE: CvReferenceEntry = {
  fullName: "",
  company: "",
  title: "",
  relation: "",
  phone: "",
  email: "",
  countryCity: "",
  callable: "",
};

const INITIAL_DATA: CvWizardData = {
  targetCountry: "",
  jobAreaId: "",
  jobTitle: "",
  roleDescription: "",
  workingSector: "",
  preferredWorkEnvironment: "",
  fullName: "",
  phone: "",
  email: "",
  age: "",
  city: "",
  nationality: "",
  maritalStatus: "",
  passportStatus: "",
  drivingLicenseInfo: "",
  relocationBarrier: "",
  abroadWorkSuitability: "",
  experienceYears: "",
  lastCompany: "",
  lastPosition: "",
  mainWorkArea: "",
  workTasks: "",
  equipments: "",
  workAreas: "",
  technicalProcesses: "",
  environmentExperience: "",
  teamworkExperience: "",
  shiftWorkExperience: "",
  educationLevel: "",
  courseTrainings: "",
  drivingLicense: "",
  srcInfo: "",
  psychotechnicInfo: "",
  journeymanCertificate: "",
  certificates: "",
  masterCertificate: "",
  myk: "",
  operatorCertificate: "",
  forkliftCertificate: "",
  craneCertificate: "",
  weldingCertificate: "",
  hygieneCertificate: "",
  oshCertificate: "",
  otherCertificates: "",
  referenceWillingness: "",
  referenceInfo: "",
  languages: "",
  notes: "",
  canWorkCountries: "",
  preferredMainCountry: "",
  shiftPreference: "",
  overtimeEligible: "",
  canAcceptAccommodation: "",
  preferredEnvironmentFlexibility: "",
  canStartNow: "",
  availabilityDate: "",
  salaryExpectation: "",
  workMode: "",
  travelBarrier: "",
  preferredCities: "",
  workType: "",
  accommodationAcceptance: "",
  positionSummary: "",
  experienceEntries: [],
  educationEntries: [],
  certificateEntries: [],
  languageEntries: [],
  referenceEntries: [],
  photoUrl: null,
};

export function CvWizard() {
  const [step, setStep] = useState<CvWizardStep>("target");
  const [data, setData] = useState<CvWizardData>(() => readCvWizardDraft() ?? INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.id === data.targetCountry) ?? null,
    [data.targetCountry]
  );

  useCvWizardAutosave(data);

  const update = <K extends keyof CvWizardData>(key: K, value: CvWizardData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const addExperienceEntry = () => {
    setData((d) => ({ ...d, experienceEntries: [...d.experienceEntries, { ...EMPTY_EXPERIENCE }] }));
  };
  const updateExperienceEntry = (index: number, patch: Partial<CvExperienceEntry>) => {
    setData((d) => ({
      ...d,
      experienceEntries: d.experienceEntries.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };
  const removeExperienceEntry = (index: number) => {
    setData((d) => ({ ...d, experienceEntries: d.experienceEntries.filter((_, i) => i !== index) }));
  };

  const addEducationEntry = () => {
    setData((d) => ({ ...d, educationEntries: [...d.educationEntries, { ...EMPTY_EDUCATION }] }));
  };
  const updateEducationEntry = (index: number, patch: Partial<CvEducationEntry>) => {
    setData((d) => ({
      ...d,
      educationEntries: d.educationEntries.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };
  const removeEducationEntry = (index: number) => {
    setData((d) => ({ ...d, educationEntries: d.educationEntries.filter((_, i) => i !== index) }));
  };

  const addCertificateEntry = () => {
    setData((d) => ({ ...d, certificateEntries: [...d.certificateEntries, { ...EMPTY_CERTIFICATE }] }));
  };
  const updateCertificateEntry = (index: number, patch: Partial<CvCertificateEntry>) => {
    setData((d) => ({
      ...d,
      certificateEntries: d.certificateEntries.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };
  const removeCertificateEntry = (index: number) => {
    setData((d) => ({ ...d, certificateEntries: d.certificateEntries.filter((_, i) => i !== index) }));
  };

  const addLanguageEntry = () => {
    setData((d) => ({ ...d, languageEntries: [...d.languageEntries, { ...EMPTY_LANGUAGE }] }));
  };
  const updateLanguageEntry = (index: number, patch: Partial<CvLanguageEntry>) => {
    setData((d) => ({
      ...d,
      languageEntries: d.languageEntries.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };
  const removeLanguageEntry = (index: number) => {
    setData((d) => ({ ...d, languageEntries: d.languageEntries.filter((_, i) => i !== index) }));
  };

  const addReferenceEntry = () => {
    setData((d) => ({ ...d, referenceEntries: [...d.referenceEntries, { ...EMPTY_REFERENCE }] }));
  };
  const updateReferenceEntry = (index: number, patch: Partial<CvReferenceEntry>) => {
    setData((d) => ({
      ...d,
      referenceEntries: d.referenceEntries.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };
  const removeReferenceEntry = (index: number) => {
    setData((d) => ({ ...d, referenceEntries: d.referenceEntries.filter((_, i) => i !== index) }));
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1]);
  };

  const goPrev = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  };

  const handleSubmitAndPay = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/cv-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        // Yalın hata; kullanıcıya basit mesaj
        // eslint-disable-next-line no-console
        console.error("cv-orders/create failed", await res.text());
        setSubmitting(false);
        return;
      }
      const json = (await res.json()) as { email: string; fullName: string; cv_order_id: string };
      if (typeof window !== "undefined") {
        const payload = {
          email: json.email,
          user_name: json.fullName,
          plan: "cv_package" as const,
          cv_order_id: json.cv_order_id,
        };
        window.sessionStorage.setItem("paytr_pending", JSON.stringify(payload));
        window.location.href = "/odeme";
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setSubmitting(false);
    }
  };

  return (
    <section
      id="cv-wizard-start"
      className="py-10 sm:py-14 bg-slate-50 text-slate-900"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">CV Bilgilerinizi Girin</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Adım {stepIndex + 1} / {STEPS.length}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Yaklaşık %{Math.round(progress)} tamamlandı
            </p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  i === stepIndex
                    ? "bg-sky-100 text-sky-700 border border-sky-200"
                    : i < stepIndex
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {i + 1}. {STEP_LABELS[s]}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.995 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
            {step === "target" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Hedef ülke ve meslek</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Hangi ülkede ve hangi alanda çalışmak istediğinizi seçin. CV&apos;nizin en üstünde böyle görünecek.
                </p>
                {selectedCountry && (
                  <p className="mt-2 text-xs text-sky-700">
                    Not: {selectedCountry.name} için başvuru sürecinde pasaport durumu ve mesleki belgeleriniz özellikle önemlidir.
                  </p>
                )}
                <div className="mt-4 space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Hedef ülke</label>
                    <button
                      type="button"
                      onClick={() => setCountryOpen((o) => !o)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 text-left placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    >
                      {selectedCountry ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="relative h-5 w-7 overflow-hidden rounded">
                            <Image
                              src={`https://flagcdn.com/w40/${selectedCountry.id}.png`}
                              alt={selectedCountry.name}
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
                          </span>
                          <span>{selectedCountry.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Ülke seçin</span>
                      )}
                    </button>
                    {countryOpen && (
                      <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              update("targetCountry", c.id);
                              setCountryOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-sky-50 ${
                              data.targetCountry === c.id ? "bg-sky-50" : ""
                            }`}
                          >
                            <span className="relative h-5 w-7 overflow-hidden rounded">
                              <Image
                                src={`https://flagcdn.com/w40/${c.id}.png`}
                                alt={c.name}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            </span>
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Meslek kategorisi</label>
                    <select
                      value={data.jobAreaId}
                      onChange={(e) => update("jobAreaId", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    >
                      <option value="">Kategori seçin</option>
                      {PROFESSION_AREAS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Meslek / Unvan</label>
                    <input
                      type="text"
                      value={data.jobTitle}
                      onChange={(e) => update("jobTitle", e.target.value)}
                      placeholder="Örn: Elektrik Ustası, Saha Elektrikçisi, Gazaltı Kaynakçısı"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1.5">Hızlı seçimler</p>
                    <div className="flex flex-wrap gap-2">
                      {["Elektrik ustası", "Kaynakçı", "Depo personeli", "CNC operatörü", "Forklift operatörü", "Tesisatçı"].map(
                        (label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => update("jobTitle", label)}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:border-sky-400 hover:bg-sky-50"
                          >
                            {label}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Çalışmak istediğiniz pozisyon</label>
                    <textarea
                      value={data.roleDescription}
                      onChange={(e) => update("roleDescription", e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="Kısa açıklama; örn: Endüstriyel tesislerde elektrik bakım ustası olarak çalışmak istiyorum."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Çalışmak istediğiniz sektör</label>
                      <input
                        type="text"
                        value={data.workingSector}
                        onChange={(e) => update("workingSector", e.target.value)}
                        placeholder="Örn: İnşaat, üretim, lojistik"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Tercih edilen çalışma ortamı</label>
                      <input
                        type="text"
                        value={data.preferredWorkEnvironment}
                        onChange={(e) => update("preferredWorkEnvironment", e.target.value)}
                        placeholder="Örn: Şantiye, fabrika, depo"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "personal" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Kişisel bilgiler</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Telefon numaranızı aktif kullandığınız şekilde yazın. İşveren veya ekibimiz bu bilgiye göre sizinle iletişim kurar.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Güven notu: Kimlik numarası gibi hassas bilgiler bu aşamada alınmaz.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Ad Soyad</label>
                    <input
                      type="text"
                      value={data.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Telefon</label>
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">E-posta</label>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Yaş</label>
                    <input
                      type="text"
                      value={data.age}
                      onChange={(e) => update("age", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Şehir</label>
                    <input
                      type="text"
                      value={data.city}
                      onChange={(e) => update("city", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Uyruk</label>
                    <input
                      type="text"
                      value={data.nationality}
                      onChange={(e) => update("nationality", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Medeni durum (opsiyonel)</label>
                    <input
                      type="text"
                      value={data.maritalStatus}
                      onChange={(e) => update("maritalStatus", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Pasaport durumu</label>
                    <input
                      type="text"
                      value={data.passportStatus}
                      onChange={(e) => update("passportStatus", e.target.value)}
                      placeholder="Örn: Var, 2029'a kadar geçerli"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Ehliyet sınıfı / ön bilgi</label>
                    <input
                      type="text"
                      value={data.drivingLicenseInfo}
                      onChange={(e) => update("drivingLicenseInfo", e.target.value)}
                      placeholder="Örn: B sınıfı"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Taşınmaya engel durum var mı?</label>
                    <input
                      type="text"
                      value={data.relocationBarrier}
                      onChange={(e) => update("relocationBarrier", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Yurtdışında çalışmaya uygunluk</label>
                    <input
                      type="text"
                      value={data.abroadWorkSuitability}
                      onChange={(e) => update("abroadWorkSuitability", e.target.value)}
                      placeholder="Örn: Aktif olarak uygun"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === "experience" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">İş deneyimi</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Toplam deneyiminizi ve son çalıştığınız işi özetleyin. Aşağıdaki alanlar, CV&apos;nizde iş deneyimi
                  bölümünü oluşturmak için kullanılır.
                </p>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Toplam deneyim yılı</label>
                      <input
                        type="text"
                        value={data.experienceYears}
                        onChange={(e) => update("experienceYears", e.target.value)}
                        placeholder="Örn: 8 yıl"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Son firma</label>
                      <input
                        type="text"
                        value={data.lastCompany}
                        onChange={(e) => update("lastCompany", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Son görev / pozisyon</label>
                    <input
                      type="text"
                      value={data.lastPosition}
                      onChange={(e) => update("lastPosition", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Çalıştığı ana alan</label>
                    <input
                      type="text"
                      value={data.mainWorkArea}
                      onChange={(e) => update("mainWorkArea", e.target.value)}
                      placeholder="Örn: Endüstriyel elektrik, üretim hattı bakım"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Yaptığınız işler / görevler
                    </label>
                    <textarea
                      value={data.workTasks}
                      onChange={(e) => update("workTasks", e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="Örn: Elektrik tesisatı, pano montajı, kablo çekimi, şantiye uygulamaları..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Kullanabildiği ekipmanlar</label>
                      <input
                        type="text"
                        value={data.equipments}
                        onChange={(e) => update("equipments", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Bildiği makineler / işlemler</label>
                      <input
                        type="text"
                        value={data.technicalProcesses}
                        onChange={(e) => update("technicalProcesses", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Ortam deneyimi</label>
                      <input
                        type="text"
                        value={data.environmentExperience}
                        onChange={(e) => update("environmentExperience", e.target.value)}
                        placeholder="Şantiye / fabrika / depo / otel / mutfak"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Takım + vardiya deneyimi</label>
                      <input
                        type="text"
                        value={data.shiftWorkExperience}
                        onChange={(e) => update("shiftWorkExperience", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">Detaylı deneyim kayıtları</p>
                      <button
                        type="button"
                        onClick={addExperienceEntry}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Deneyim Ekle
                      </button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {data.experienceEntries.map((entry, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              value={entry.company}
                              onChange={(e) => updateExperienceEntry(index, { company: e.target.value })}
                              placeholder="Firma adı"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={entry.countryCity}
                              onChange={(e) => updateExperienceEntry(index, { countryCity: e.target.value })}
                              placeholder="Ülke / şehir"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={entry.position}
                              onChange={(e) => updateExperienceEntry(index, { position: e.target.value })}
                              placeholder="Görev / pozisyon"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={entry.projectType}
                              onChange={(e) => updateExperienceEntry(index, { projectType: e.target.value })}
                              placeholder="Proje / alan türü"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              value={entry.startDate}
                              onChange={(e) => updateExperienceEntry(index, { startDate: e.target.value })}
                              placeholder="Başlangıç tarihi"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={entry.endDate}
                              onChange={(e) => updateExperienceEntry(index, { endDate: e.target.value })}
                              placeholder="Bitiş tarihi"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <textarea
                            value={entry.tasks}
                            onChange={(e) => updateExperienceEntry(index, { tasks: e.target.value })}
                            placeholder="Yaptığı işler"
                            rows={2}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <textarea
                            value={entry.equipments}
                            onChange={(e) => updateExperienceEntry(index, { equipments: e.target.value })}
                            placeholder="Kullandığı ekipman / makineler"
                            rows={2}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeExperienceEntry(index)}
                            className="mt-2 text-xs text-red-600 hover:text-red-700"
                          >
                            Deneyimi kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "education" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Eğitim bilgileri</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Eğitim düzeyinizi ve eklediğiniz kurum/kurs kayıtlarını CV&apos;nizde ayrı bölümde gösteririz.
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Eğitim durumu</label>
                    <select
                      value={data.educationLevel}
                      onChange={(e) => update("educationLevel", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    >
                      <option value="">Seçin</option>
                      <option>İlkokul</option>
                      <option>Ortaokul</option>
                      <option>Lise</option>
                      <option>Teknik lise</option>
                      <option>Meslek lisesi</option>
                      <option>Ön lisans</option>
                      <option>Lisans</option>
                      <option>Diğer</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">Eğitim kaydı</p>
                      <button
                        type="button"
                        onClick={addEducationEntry}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Eğitim Ekle
                      </button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {data.educationEntries.map((entry, index) => (
                        <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              value={entry.schoolName}
                              onChange={(e) => updateEducationEntry(index, { schoolName: e.target.value })}
                              placeholder="Okul / kurum adı"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={entry.department}
                              onChange={(e) => updateEducationEntry(index, { department: e.target.value })}
                              placeholder="Bölüm / alan"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={entry.level}
                              onChange={(e) => updateEducationEntry(index, { level: e.target.value })}
                              placeholder="Eğitim seviyesi"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={entry.graduationStatus}
                              onChange={(e) => updateEducationEntry(index, { graduationStatus: e.target.value })}
                              placeholder="Mezuniyet durumu"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={entry.startYear}
                              onChange={(e) => updateEducationEntry(index, { startYear: e.target.value })}
                              placeholder="Başlangıç yılı"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <input
                              value={entry.endYear}
                              onChange={(e) => updateEducationEntry(index, { endYear: e.target.value })}
                              placeholder="Bitiş yılı"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEducationEntry(index)}
                            className="mt-2 text-xs text-red-600 hover:text-red-700"
                          >
                            Eğitimi kaldır
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Kurs ve mesleki eğitimler</label>
                    <textarea
                      value={data.courseTrainings}
                      onChange={(e) => update("courseTrainings", e.target.value)}
                      rows={3}
                      placeholder="Örn: Kaynak kursu, MYK hazırlık, operatör eğitimi..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === "documents" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Belgeler ve ek bilgiler</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Sürücü belgesi, ustalık belgesi, MYK ve yabancı dil gibi bilgileri buraya ekleyin.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Ehliyet</label>
                    <input
                      type="text"
                      value={data.drivingLicense}
                      onChange={(e) => update("drivingLicense", e.target.value)}
                      placeholder="Örn: B sınıfı, SRC, Psikoteknik"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">SRC</label>
                    <input
                      type="text"
                      value={data.srcInfo}
                      onChange={(e) => update("srcInfo", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Psikoteknik</label>
                    <input
                      type="text"
                      value={data.psychotechnicInfo}
                      onChange={(e) => update("psychotechnicInfo", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Sertifikalar / belgeler</label>
                    <input
                      type="text"
                      value={data.certificates}
                      onChange={(e) => update("certificates", e.target.value)}
                      placeholder="Örn: Kaynak sertifikası, iş güvenliği eğitimi"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Kalfalık belgesi</label>
                    <input
                      type="text"
                      value={data.journeymanCertificate}
                      onChange={(e) => update("journeymanCertificate", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Ustalık belgesi</label>
                    <input
                      type="text"
                      value={data.masterCertificate}
                      onChange={(e) => update("masterCertificate", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">MYK / Operatör belgesi</label>
                    <input
                      type="text"
                      value={data.myk}
                      onChange={(e) => update("myk", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Forklift belgesi</label>
                    <input
                      type="text"
                      value={data.forkliftCertificate}
                      onChange={(e) => update("forkliftCertificate", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Vinç belgesi</label>
                    <input
                      type="text"
                      value={data.craneCertificate}
                      onChange={(e) => update("craneCertificate", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Kaynak sertifikası</label>
                    <input
                      type="text"
                      value={data.weldingCertificate}
                      onChange={(e) => update("weldingCertificate", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Hijyen belgesi</label>
                    <input
                      type="text"
                      value={data.hygieneCertificate}
                      onChange={(e) => update("hygieneCertificate", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">İSG belgesi</label>
                    <input
                      type="text"
                      value={data.oshCertificate}
                      onChange={(e) => update("oshCertificate", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Diğer sertifikalar</label>
                    <input
                      type="text"
                      value={data.otherCertificates}
                      onChange={(e) => update("otherCertificates", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">Detaylı sertifika kayıtları</p>
                    <button
                      type="button"
                      onClick={addCertificateEntry}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Sertifika Ekle
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {data.certificateEntries.map((entry, index) => (
                      <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            value={entry.name}
                            onChange={(e) => updateCertificateEntry(index, { name: e.target.value })}
                            placeholder="Belge adı"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.number}
                            onChange={(e) => updateCertificateEntry(index, { number: e.target.value })}
                            placeholder="Belge numarası (opsiyonel)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.validityDate}
                            onChange={(e) => updateCertificateEntry(index, { validityDate: e.target.value })}
                            placeholder="Geçerlilik tarihi (opsiyonel)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertificateEntry(index)}
                          className="mt-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Sertifikayı kaldır
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === "languagesReferences" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Dil bilgisi ve referanslar</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Yabancı dil seviyeniz ve referanslarınız işveren tarafında güven oluşturur.
                </p>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">Dil kayıtları</p>
                    <button
                      type="button"
                      onClick={addLanguageEntry}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Dil Ekle
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {data.languageEntries.map((entry, index) => (
                      <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            value={entry.language}
                            onChange={(e) => updateLanguageEntry(index, { language: e.target.value })}
                            placeholder="Dil"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.level}
                            onChange={(e) => updateLanguageEntry(index, { level: e.target.value })}
                            placeholder="Seviye (A2, B1...)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.speaking}
                            onChange={(e) => updateLanguageEntry(index, { speaking: e.target.value })}
                            placeholder="Konuşma"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.writing}
                            onChange={(e) => updateLanguageEntry(index, { writing: e.target.value })}
                            placeholder="Yazma"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.understanding}
                            onChange={(e) => updateLanguageEntry(index, { understanding: e.target.value })}
                            placeholder="Anlama"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLanguageEntry(index)}
                          className="mt-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Dili kaldır
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Referans vermek istiyor musunuz?</label>
                  <select
                    value={data.referenceWillingness}
                    onChange={(e) => update("referenceWillingness", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="">Seçin</option>
                    <option>Evet</option>
                    <option>Hayır</option>
                    <option>Gerekirse paylaşırım</option>
                  </select>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">Referans kayıtları</p>
                    <button
                      type="button"
                      onClick={addReferenceEntry}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Referans Ekle
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {data.referenceEntries.map((entry, index) => (
                      <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            value={entry.fullName}
                            onChange={(e) => updateReferenceEntry(index, { fullName: e.target.value })}
                            placeholder="Ad Soyad"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.company}
                            onChange={(e) => updateReferenceEntry(index, { company: e.target.value })}
                            placeholder="Firma"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.title}
                            onChange={(e) => updateReferenceEntry(index, { title: e.target.value })}
                            placeholder="Görevi / unvanı"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.relation}
                            onChange={(e) => updateReferenceEntry(index, { relation: e.target.value })}
                            placeholder="İlişki (eski işveren, şef vb.)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.phone}
                            onChange={(e) => updateReferenceEntry(index, { phone: e.target.value })}
                            placeholder="Telefon (opsiyonel)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.email}
                            onChange={(e) => updateReferenceEntry(index, { email: e.target.value })}
                            placeholder="E-posta (opsiyonel)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.countryCity}
                            onChange={(e) => updateReferenceEntry(index, { countryCity: e.target.value })}
                            placeholder="Ülke / şehir"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                          <input
                            value={entry.callable}
                            onChange={(e) => updateReferenceEntry(index, { callable: e.target.value })}
                            placeholder="Aranabilir mi"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeReferenceEntry(index)}
                          className="mt-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Referansı kaldır
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === "photo" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Profil fotoğrafı</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  İsterseniz CV&apos;nize eklenecek bir profil fotoğrafı yükleyebilirsiniz. Yüklemezseniz sistem fotoğrafsız
                  CV hazırlar.
                </p>
                <div className="mt-4">
                  <PhotoUpload
                    photoUrl={data.photoUrl}
                    photoFile={photoFile}
                    onPhotoChange={(file) => {
                      setPhotoFile(file);
                    }}
                    onClear={() => {
                      setPhotoFile(null);
                      update("photoUrl", null);
                    }}
                    onPhotoUploaded={(file, url) => {
                      setPhotoFile(file);
                      update("photoUrl", url);
                    }}
                  />
                </div>
              </div>
            )}

            {step === "preferences" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Çalışma tercihi</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Hangi ülkelerde ve hangi şartlarda çalışabileceğinizi belirtin. Bu alanlar, işverenle uyumu göstermek
                  için kullanılır.
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Hangi ülkelerde çalışabilirsiniz?</label>
                    <input
                      type="text"
                      value={data.canWorkCountries}
                      onChange={(e) => update("canWorkCountries", e.target.value)}
                      placeholder="Örn: Almanya, Hollanda, Belçika"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Tercih edilen ana ülke</label>
                    <input
                      type="text"
                      value={data.preferredMainCountry}
                      onChange={(e) => update("preferredMainCountry", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Vardiya tercihi</label>
                    <input
                      type="text"
                      value={data.shiftPreference}
                      onChange={(e) => update("shiftPreference", e.target.value)}
                      placeholder="Örn: Vardiyalı çalışabilirim, gece vardiyasına uygunum"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Fazla mesaiye uygun mu?</label>
                    <input
                      type="text"
                      value={data.overtimeEligible}
                      onChange={(e) => update("overtimeEligible", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Konaklamalı iş kabul eder misiniz?</label>
                      <input
                        type="text"
                        value={data.canAcceptAccommodation}
                        onChange={(e) => update("canAcceptAccommodation", e.target.value)}
                        placeholder="Evet / Hayır / Duruma göre"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Ne zaman başlayabilirsiniz?</label>
                      <input
                        type="text"
                        value={data.canStartNow}
                        onChange={(e) => update("canStartNow", e.target.value)}
                        placeholder="Örn: Hemen, 2 hafta içinde"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Maaş beklentiniz</label>
                      <input
                        type="text"
                        value={data.salaryExpectation}
                        onChange={(e) => update("salaryExpectation", e.target.value)}
                        placeholder="Örn: Saatlik / aylık net beklentiniz"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Çalışma şekli</label>
                      <input
                        type="text"
                        value={data.workMode}
                        onChange={(e) => update("workMode", e.target.value)}
                        placeholder="Örn: Uzun dönem / proje bazlı"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Seyahat engeli var mı?</label>
                      <input
                        type="text"
                        value={data.travelBarrier}
                        onChange={(e) => update("travelBarrier", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Görev alabileceği şehirler</label>
                      <input
                        type="text"
                        value={data.preferredCities}
                        onChange={(e) => update("preferredCities", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1.5">Hızlı tercihler</p>
                    <div className="flex flex-wrap gap-2">
                      {["Uzun dönem", "Proje bazlı", "Sezonluk", "Hemen başlayabilirim", "Konaklamalı kabul", "Vardiyalı çalışabilirim"].map(
                        (badge) => (
                          <button
                            key={badge}
                            type="button"
                            onClick={() => update("workType", data.workType ? `${data.workType}, ${badge}` : badge)}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:border-sky-400 hover:bg-sky-50"
                          >
                            {badge}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "review" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Kontrol ve önizleme</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Aşağıda özetlediğimiz bilgiler, hazırlanacak Türkçe CV, İngilizce CV ve iş başvuru mektubunuz için
                  kullanılacaktır. Ekibimiz bilgilerinizi manuel olarak kontrol edip düzenleyecektir.
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-800">
                  <p>
                    <span className="font-medium text-slate-600">Ad Soyad:</span> {data.fullName || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">E-posta:</span> {data.email || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">Hedef ülke:</span> {data.targetCountry || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">Meslek / unvan:</span> {data.jobTitle || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">Toplam deneyim:</span> {data.experienceYears || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">Eğitim durumu:</span> {data.educationLevel || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">Belge sayısı:</span> {data.certificateEntries.length || 0}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">Referans durumu:</span> {data.referenceWillingness || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-600">Profil fotoğrafı:</span> {data.photoUrl ? "Var" : "Yok"}
                  </p>
                </div>
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Hazırlanacak paket</h3>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Türkçe CV</li>
                    <li>• İngilizce CV</li>
                    <li>• İş başvuru mektubu</li>
                  </ul>
                  <p className="mt-3 text-sm text-slate-900">
                    Toplam ücret: <span className="font-semibold text-sky-600">349 TL</span>
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Formu tamamladıktan sonra ödeme adımına geçeceksiniz. Ekibimiz, bilgilerinizi kontrol ederek teknik
                    mesleklere uygun profesyonel formatta düzenlenmiş çıktılar hazırlayacaktır.
                  </p>
                </div>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>

          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-50">Sipariş Özeti</h3>
                <p className="mt-2 text-3xl font-semibold text-sky-400">349 TL</p>
                <ul className="mt-3 text-sm text-slate-200 space-y-1.5">
                  <li>✔ Türkçe CV hazırlanacak</li>
                  <li>✔ İngilizce CV hazırlanacak</li>
                  <li>✔ İş başvuru mektubu hazırlanacak</li>
                </ul>
                <p className="mt-3 text-xs text-slate-400">
                  Formu tamamladıktan sonra ödeme adımına geçersiniz.
                </p>
              </div>

              {selectedCountry && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-lg flex items-center gap-3">
                  <div className="relative h-8 w-12 overflow-hidden rounded-lg border border-slate-700/80 shrink-0">
                    <Image
                      src={`https://flagcdn.com/w80/${selectedCountry.id}.png`}
                      alt={selectedCountry.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-300">Seçilen ülke</p>
                    <p className="text-sm text-slate-50">{selectedCountry.name}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIndex === 0 || submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </button>
          {step === "review" ? (
            <button
              type="button"
              onClick={handleSubmitAndPay}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Ödemeye Geç ve Kaydı Tamamla
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              İleri
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

