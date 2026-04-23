import { DOC_CATEGORY_KEYS, LEGAL_CONSENT_KEYS, LISTING_PACKAGES, isValidProfessionId } from "./constants";
import type { BasvuruPricingInput } from "./pricing";
import type { BasvuruWizardFormState } from "./wizardTypes";
import { LANGUAGE_LEVELS } from "./constants";

const LEVEL_SET = new Set<string>([...LANGUAGE_LEVELS]);

function safeFormShape(raw: unknown): raw is Record<string, unknown> {
  return raw != null && typeof raw === "object" && !Array.isArray(raw);
}

/** Sıralı dizi eşitliği (fiyat = normalize edilmiş ülke listesi) */
function sameCountrySet(a: string[], b: string[]): boolean {
  const x = [...a].map((k) => k.toLowerCase()).sort();
  const y = [...b].map((k) => k.toLowerCase()).sort();
  if (x.length !== y.length) return false;
  return x.every((v, i) => v === y[i]);
}

const PATH_PREFIX = (userId: string) => new RegExp(`^${userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/basvuru/[^/]+/`);

/**
 * client `form` + server `pricing` aynı checkout için uyumlu mu (manipülasyon engeli).
 */
export function assertFormMatchesPricing(
  form: BasvuruWizardFormState,
  pricing: BasvuruPricingInput
): { ok: true } | { ok: false; error: string } {
  const prof = typeof form.professionId === "string" ? form.professionId.trim() : "";
  if (!isValidProfessionId(prof) || prof !== pricing.profession_id) {
    return { ok: false, error: "Meslek seçimi ile fiyat verisi uyuşmuyor. Sayfayı yenileyin." };
  }
  const countries = Array.isArray(form.countryKeys) ? form.countryKeys : [];
  if (!countries.length || !sameCountrySet(countries, pricing.country_keys)) {
    return { ok: false, error: "Ülke seçimi fiyat verisiyle uyuşmuyor. Sayfayı yenileyin." };
  }
  const lp =
    typeof form.listingPackageId === "number" && Number.isFinite(form.listingPackageId)
      ? form.listingPackageId
      : Number(form.listingPackageId);
  if (!Number.isFinite(lp) || lp !== pricing.listing_package_id) {
    return { ok: false, error: "İlan paketi fiyat verisiyle uyuşmuyor. Sayfayı yenileyin." };
  }
  if (!LISTING_PACKAGES.some((p) => p.id === lp)) {
    return { ok: false, error: "Geçersiz ilan paketi." };
  }
  return { ok: true };
}

/**
 * Sözleşme adımları + CV zorunluluğu + belge yolları kullanıcıya ait.
 */
export function assertBasvuruWizardReadyForPayment(
  rawForm: unknown,
  pricing: BasvuruPricingInput,
  userId: string
): { ok: true; form: BasvuruWizardFormState } | { ok: false; error: string } {
  if (!safeFormShape(rawForm)) {
    return { ok: false, error: "Form verisi geçersiz." };
  }
  const o = rawForm as Record<string, unknown>;
  if (typeof o.fullName !== "string" || !o.fullName.trim()) {
    return { ok: false, error: "Ad soyad eksik." };
  }
  if (typeof o.email !== "string" || !o.email.trim()) {
    return { ok: false, error: "E-posta eksik." };
  }
  if (typeof o.whatsapp !== "string" || o.whatsapp.replace(/\D/g, "").length < 10) {
    return { ok: false, error: "WhatsApp / telefon geçersiz." };
  }

  const form = o as unknown as BasvuruWizardFormState;
  const align = assertFormMatchesPricing(form, pricing);
  if (!align.ok) return align;

  if (!form.legal || typeof form.legal !== "object") {
    return { ok: false, error: "Sözleşme onayları eksik." };
  }
  for (const k of LEGAL_CONSENT_KEYS) {
    if (form.legal[k] !== true) {
      return { ok: false, error: "Sözleşme ve açık rıza onayları tamamlanmalıdır." };
    }
  }

  const files = form.filesByCategory;
  if (!files || typeof files !== "object") {
    return { ok: false, error: "Belge alanı geçersiz." };
  }
  for (const k of DOC_CATEGORY_KEYS) {
    if (!Array.isArray((files as Record<string, unknown>)[k])) {
      return { ok: false, error: "Belge listesi hatalı." };
    }
  }
  const cvList = files.cv;
  if (!Array.isArray(cvList) || cvList.length < 1) {
    return { ok: false, error: "CV yüklemesi zorunludur. Belgeler adımını tamamlayın." };
  }
  for (const f of cvList) {
    if (!f || typeof f.path !== "string" || !f.path) {
      return { ok: false, error: "CV yolu geçersiz. Yeniden yükleyin." };
    }
  }

  const pathRe = PATH_PREFIX(userId);
  for (const cat of DOC_CATEGORY_KEYS) {
    const list = files[cat];
    if (!Array.isArray(list)) {
      return { ok: false, error: "Belge listesi hatalı." };
    }
    for (const file of list) {
      if (!file || typeof file.path !== "string" || !file.path) {
        return { ok: false, error: "Geçersiz belge yolu." };
      }
      if (!pathRe.test(file.path)) {
        return { ok: false, error: "Belge yolu yetki doğrulamasından geçmedi." };
      }
      if (file.path.includes("..")) {
        return { ok: false, error: "Geçersiz belge yolu." };
      }
    }
  }

  if (form.knowsForeignLanguage) {
    if (!form.languages?.length) {
      return { ok: false, error: "Dil satırları eksik veya hatalı." };
    }
    for (const row of form.languages) {
      if (!row || typeof row.name !== "string" || !row.name.trim()) {
        return { ok: false, error: "Dil adı boş satır var." };
      }
      if (typeof row.level !== "string" || !LEVEL_SET.has(row.level)) {
        return { ok: false, error: "Dil seviyesi geçersiz." };
      }
    }
  }

  const cleaned = buildSanitizedFormForStorage(form, pricing);
  return { ok: true, form: cleaned };
}

/**
 * Fiyat = kaynak; form görünen alanlar pricing ile hizalanır, diller sadeleştirilir.
 */
export function buildSanitizedFormForStorage(
  form: BasvuruWizardFormState,
  pricing: BasvuruPricingInput
): BasvuruWizardFormState {
  const languages =
    form.knowsForeignLanguage && Array.isArray(form.languages)
      ? form.languages
          .filter((r) => r && typeof r.name === "string" && r.name.trim() && r.level && LEVEL_SET.has(r.level))
          .map((r) => ({ name: r.name.trim(), level: r.level }))
      : [];

  return {
    ...form,
    professionId: pricing.profession_id,
    countryKeys: [...pricing.country_keys],
    listingPackageId: pricing.listing_package_id,
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    whatsapp: form.whatsapp.trim(),
    languages,
    filesByCategory: form.filesByCategory,
  };
}

export const ALLOWED_UPLOAD_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function isAllowedUploadMime(mime: string, fileName: string): boolean {
  const m = mime.toLowerCase().split(";")[0]!.trim();
  if (ALLOWED_UPLOAD_MIME.includes(m as (typeof ALLOWED_UPLOAD_MIME)[number])) {
    return true;
  }
  if (!m || m === "application/octet-stream") {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    return ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"].includes(ext);
  }
  return false;
}
