"use client";

import { useCallback, useEffect, useId, useMemo, useState, type DragEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Search,
  Shield,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TargetCountryFlagOrIso } from "@/components/yurtdisi-is-basvuru-destegi/TargetCountryFlagSpan";
import { supabase } from "@/lib/supabase";
import type { IndividualBillingPayload } from "@/lib/billingIndividual";
import {
  DOC_CATEGORY_KEYS,
  DOC_CATEGORY_LABELS,
  LANGUAGE_LEVELS,
  LEGAL_CONSENT_COPY,
  LEGAL_CONSENT_GROUPS,
  LEGAL_CONSENT_KEYS,
  LISTING_PACKAGES,
  PROFESSION_OPTIONS,
  TARGET_COUNTRY_OPTIONS,
  YURTDISI_BASVURU_BASE_TRY,
  YURTDISI_BASVURU_EXTRA_COUNTRY_TRY,
  isAllowedCountryKey,
  professionLabelById,
  professionSearchableText,
  targetDisplayWithFlag,
  targetMetaByKey,
  targetMatchesQuery,
  type DocCategoryKey,
} from "@/lib/yurtdisiIsBasvuruDestegi/constants";
import { YURTDISI_BASVURU_CANONICAL_PATH } from "@/lib/yurtdisiIsBasvuruDestegi/paths";
import { YURTDISI_BASVURU_BASKET, YURTDISI_BASVURU_PAYMENT_TYPE } from "@/lib/yurtdisiIsBasvuruDestegi/paytr";
import { emptyBasvuruWizardState, type BasvuruWizardFormState, type LanguageRow } from "@/lib/yurtdisiIsBasvuruDestegi/wizardTypes";
import { useBasvuruComputedPrice } from "./useBasvuruComputedPrice";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ADMIN_BASVURU_FREE_UNLIMITED_COUPON,
  isAdminBasvuruFreeUnlimitedActive,
  isAdminBasvuruFreeUnlimitedCoupon,
} from "@/lib/yurtdisiIsBasvuruDestegi/adminBasvuruTestCoupon";

const STEPS = [
  { n: 1, label: "Hizmet" },
  { n: 2, label: "Bilgiler" },
  { n: 3, label: "Meslek" },
  { n: 4, label: "Hedef" },
  { n: 5, label: "İlan paketi" },
  { n: 6, label: "Belgeler" },
  { n: 7, label: "Mülakat" },
  { n: 8, label: "Sözleşmeler" },
  { n: 9, label: "Fatura" },
  { n: 10, label: "Ödeme" },
] as const;

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateMerchantOid() {
  return "ord" + Date.now() + String(Math.random()).slice(2, 10);
}

export type BasvuruDestegiWizardProps = {
  open: boolean;
  onClose: () => void;
};

export function BasvuruDestegiWizard({ open, onClose }: BasvuruDestegiWizardProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const titleId = useId();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BasvuruWizardFormState>(emptyBasvuruWizardState);
  const [draftId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `d${Date.now()}`
  );
  const [profQuery, setProfQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [uploading, setUploading] = useState<DocCategoryKey | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [payIframe, setPayIframe] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkoutCoupon, setCheckoutCoupon] = useState("");

  const { price, pricingInput, ok: priceOk } = useBasvuruComputedPrice(form);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setForm(emptyBasvuruWizardState());
      setProfQuery("");
      setCountryQuery("");
      setPayError(null);
      setPayIframe(null);
      setFieldErrors({});
      setCheckoutCoupon("");
    }
  }, [open]);

  useEffect(() => {
    if (user?.email) {
      setForm((f) => ({ ...f, email: f.email || user.email || "" }));
    }
  }, [user?.email]);

  useEffect(() => {
    if (step !== 9) return;
    setForm((f) => {
      if (f.invoiceEmail.trim() || !user?.email) return f;
      return { ...f, invoiceEmail: user.email! };
    });
  }, [step, user?.email]);

  const canPassStep2 = useMemo(() => {
    if (!form.fullName.trim() || !form.email.trim() || !form.whatsapp.trim()) return false;
    if (!EMAIL_RE.test(form.email.trim())) return false;
    if (onlyDigits(form.whatsapp).length < 10) return false;
    if (form.hasPassport === null || form.hasAbroadExperience === null || form.knowsForeignLanguage === null) return false;
    if (form.knowsForeignLanguage) {
      if (form.languages.length === 0) return false;
      for (const l of form.languages) {
        if (!l.name.trim() || !l.level) return false;
      }
    }
    return true;
  }, [form]);

  const validateStep = (s: number): boolean => {
    const err: Record<string, string> = {};
    if (s === 2) {
      if (!canPassStep2) err.general = "Lütfen tüm alanları eksiksiz doldurun.";
    }
    if (s === 3) {
      if (!form.professionId) err.profession = "Meslek veya alan seçimi zorunludur.";
    }
    if (s === 4) {
      if (form.countryKeys.length === 0) err.countries = "En az bir hedef ülke veya bölge seçin.";
    }
    if (s === 5) {
      if (!form.listingPackageId) err.listing = "Bir ilan paketi seçin.";
    }
    if (s === 6) {
      if (!user) err.auth = "Belge yüklemek için giriş yapın.";
      if (form.filesByCategory.cv.length === 0) err.cv = "CV yüklemesi zorunludur.";
    }
    if (s === 8) {
      for (const k of LEGAL_CONSENT_KEYS) {
        if (!form.legal[k]) {
          err.legal = "Tüm hizmet şartı ve bilgilendirme maddelerini onaylamanız gerekir.";
          break;
        }
      }
    }
    if (s === 9) {
      if (!form.invoiceFirstName.trim() || !form.invoiceLastName.trim()) err.inv = "Ad ve soyad zorunludur.";
      if (!form.invoiceAddress.trim()) err.inv = "Adres zorunludur.";
      if (!form.invoiceCity.trim() || !form.invoiceDistrict.trim()) err.inv = "İl ve ilçe zorunludur.";
      if (form.invoicePostal.trim().length < 3) err.inv = "Posta kodu zorunludur.";
      if (!form.invoiceEmail.trim() || !EMAIL_RE.test(form.invoiceEmail)) err.inv = "Geçerli fatura e-postası girin.";
      if (onlyDigits(form.invoicePhone).length < 10) err.inv = "Geçerli telefon numarası girin.";
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step === 5 && !priceOk) return;
    if (step === 6 && !user) return;
    setStep((x) => Math.min(10, x + 1));
  };
  const goBack = () => setStep((x) => Math.max(1, x - 1));

  const setBool = (key: "hasPassport" | "hasAbroadExperience" | "knowsForeignLanguage", v: boolean) => {
    setForm((f) => {
      const next = { ...f, [key]: v };
      if (key === "knowsForeignLanguage" && !v) next.languages = [];
      if (key === "knowsForeignLanguage" && v && next.languages.length === 0) next.languages = [{ name: "", level: "B1" }];
      return next;
    });
  };

  const addLanguage = () => setForm((f) => ({ ...f, languages: [...f.languages, { name: "", level: "B1" }] }));
  const updateLanguage = (i: number, p: Partial<LanguageRow>) =>
    setForm((f) => {
      const languages = f.languages.map((row, j) => (j === i ? { ...row, ...p } : row));
      return { ...f, languages };
    });
  const removeLanguage = (i: number) =>
    setForm((f) => ({ ...f, languages: f.languages.filter((_, j) => j !== i) }));

  const toggleCountry = (key: string) => {
    if (!isAllowedCountryKey(key)) return;
    setForm((f) => {
      const has = f.countryKeys.includes(key);
      const countryKeys = has ? f.countryKeys.filter((k) => k !== key) : [...f.countryKeys, key];
      return { ...f, countryKeys };
    });
  };

  const onFileDrop = (e: DragEvent, cat: DocCategoryKey) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    onUpload(cat, e.dataTransfer.files);
  };

  const onUpload = async (cat: DocCategoryKey, fileList: FileList | null) => {
    if (!fileList?.[0] || !user) return;
    setUploading(cat);
    setPayError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Oturum bulunamadı.");
      const body = new FormData();
      body.set("file", fileList[0]);
      body.set("category", cat);
      body.set("draftId", draftId);
      const res = await fetch("/api/basvuru-destegi/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = (await res.json().catch(() => ({}))) as { path?: string; originalName?: string; size?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "Yükleme başarısız.");
      setForm((f) => ({
        ...f,
        filesByCategory: {
          ...f.filesByCategory,
          [cat]: [
            ...f.filesByCategory[cat],
            {
              path: data.path!,
              originalName: data.originalName!,
              size: data.size!,
              category: cat,
            },
          ],
        },
      }));
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Yükleme hatası.");
    } finally {
      setUploading(null);
    }
  };

  const removeFile = (cat: DocCategoryKey, path: string) => {
    setForm((f) => ({
      ...f,
      filesByCategory: {
        ...f.filesByCategory,
        [cat]: f.filesByCategory[cat].filter((x) => x.path !== path),
      },
    }));
  };

  const buildBilling = useCallback((): IndividualBillingPayload | null => {
    if (!price?.totalTry || !pricingInput) return null;
    const total = price.totalTry;
    const adminFree = isAdminBasvuruFreeUnlimitedActive(checkoutCoupon);
    return {
      service_name: YURTDISI_BASVURU_BASKET,
      first_name: form.invoiceFirstName.trim(),
      last_name: form.invoiceLastName.trim(),
      address_line1: form.invoiceAddress.trim(),
      address_line2: null,
      city: form.invoiceCity.trim(),
      district: form.invoiceDistrict.trim(),
      postal_code: form.invoicePostal.trim(),
      email: form.invoiceEmail.trim().toLowerCase(),
      phone: onlyDigits(form.invoicePhone),
      tckn: form.invoiceTckn.trim() ? onlyDigits(form.invoiceTckn) : null,
      invoice_note: form.invoiceNote.trim() || null,
      confirm_invoice_accuracy: true,
      confirm_terms: true,
      pricing: adminFree
        ? {
            gross_amount: total,
            discount_amount: total,
            net_amount: 0,
            coupon_code: ADMIN_BASVURU_FREE_UNLIMITED_COUPON,
          }
        : {
            gross_amount: total,
            discount_amount: 0,
            net_amount: total,
          },
    };
  }, [form, price?.totalTry, pricingInput, checkoutCoupon]);

  const startPaytr = useCallback(async () => {
    setPayError(null);
    if (!validateStep(9)) return;
    if (!priceOk || !pricingInput || !buildBilling()) {
      setPayError("Fiyat veya fatura verisi hazır değil.");
      return;
    }
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.user?.id || !sess.session.user.email) {
      setPayError("Oturum gerekli. Lütfen giriş yapın.");
      return;
    }
    const emailPaytr = sess.session.user.email.trim();
    if (form.invoiceEmail.trim().toLowerCase() !== emailPaytr.toLowerCase()) {
      setPayError("Fatura e-postası, giriş yaptığınız e-posta ile aynı olmalıdır.");
      return;
    }
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const billing = buildBilling()!;
    const body = {
      merchant_oid: generateMerchantOid(),
      email: emailPaytr,
      amount: billing.pricing.net_amount,
      user_name: `${form.invoiceFirstName} ${form.invoiceLastName}`.trim() || "Müşteri",
      user_address: form.invoiceAddress.trim() || "Adres girilmedi",
      user_phone: onlyDigits(form.invoicePhone) || "5550000000",
      merchant_ok_url: `${siteUrl}${YURTDISI_BASVURU_CANONICAL_PATH}?odeme=ok`,
      merchant_fail_url: `${siteUrl}${YURTDISI_BASVURU_CANONICAL_PATH}?odeme=fail`,
      basket_description: YURTDISI_BASVURU_BASKET,
      payment_type: YURTDISI_BASVURU_PAYMENT_TYPE,
      user_id: sess.session.user.id,
      coupon_code: checkoutCoupon.trim() || undefined,
      individual_billing: billing,
      yurtdisi_basvuru: {
        pricing: pricingInput,
        form: { ...form, email: form.email, whatsapp: form.whatsapp } as BasvuruWizardFormState,
      },
    };
    const res = await fetch("/api/paytr/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 503) {
      setPayError("Ödeme şu an geçici olarak durdurulmuş olabilir. Lütfen bir süre sonra yeniden deneyin.");
      return;
    }
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      iframe_url?: string | null;
      completed_without_paytr?: boolean;
      error?: string;
    };
    if (data.success && data.completed_without_paytr) {
      setStep(10);
      setPayIframe(null);
      onClose();
      router.replace(`${YURTDISI_BASVURU_CANONICAL_PATH}?odeme=ok`);
      return;
    }
    if (data.success && data.iframe_url) {
      setStep(10);
      setPayIframe(data.iframe_url);
    } else {
      setPayError(data.error || "Ödeme başlatılamadı.");
    }
  }, [form, buildBilling, priceOk, pricingInput, checkoutCoupon, router, onClose, YURTDISI_BASVURU_CANONICAL_PATH]);

  if (!open) return null;

  const filteredProfessions = PROFESSION_OPTIONS.filter(
    (p) =>
      professionSearchableText(p).toLocaleLowerCase("tr-TR").includes(profQuery.toLocaleLowerCase("tr-TR")) ||
      profQuery.trim() === ""
  );
  const filteredEurope = TARGET_COUNTRY_OPTIONS.filter(
    (c) => c.group === "europe" && targetMatchesQuery(c.id, countryQuery)
  );
  const filteredInternational = TARGET_COUNTRY_OPTIONS.filter(
    (c) => c.group === "international" && targetMatchesQuery(c.id, countryQuery)
  );

  const extraCountries = Math.max(0, form.countryKeys.length - 1);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] flex min-h-0 flex-col bg-[#0a1220] text-[#F6F1E8] top-[calc(var(--site-header-occupancy,3.5rem)+var(--site-wizard-below-header-gap,1rem))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="shrink-0 border-b border-white/10 bg-gradient-to-b from-[#0f1a2c] to-[#0a1220] px-3 py-3.5 sm:px-5 sm:py-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start sm:gap-4">
            <h2 id={titleId} className="font-serif text-base font-semibold text-[#FEFDFB] sm:text-lg">
              Yurtdışı İş Başvuru Danışmanlığı
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-200 transition hover:border-amber-400/30 hover:text-white"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-amber-500/20 bg-white/[0.04] px-3 py-2.5 sm:max-w-sm"
            aria-live="polite"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">Başlangıç</p>
              <p className="text-sm font-bold text-white">{formatTry(YURTDISI_BASVURU_BASE_TRY)}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">Güncel toplam</p>
              <p className="text-lg font-bold tabular-nums text-amber-300">
                {priceOk && price ? formatTry(price.totalTry) : "—"}
              </p>
            </div>
          </div>
        </div>
        {priceOk && price && step >= 2 && (
          <div className="mx-auto mt-3 max-w-5xl rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/75">Fiyat dökümü</p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-200 sm:text-xs">
              <li className="flex justify-between gap-3">
                <span className="text-slate-400">Temel hizmet</span>
                <span className="shrink-0 font-medium tabular-nums text-white">{formatTry(price.baseTry)}</span>
              </li>
              {price.extraCountriesCount > 0 && (
                <li className="flex justify-between gap-3">
                  <span className="text-slate-400">
                    Ek hedef ({price.extraCountriesCount} × {YURTDISI_BASVURU_EXTRA_COUNTRY_TRY} TL)
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-amber-200/90">{formatTry(price.extraCountryChargeTry)}</span>
                </li>
              )}
              <li className="flex justify-between gap-3">
                <span className="text-slate-400">
                  İlan paketi · {price.listingPackage.label}
                  {price.listingPackage.addTry === 0 ? " (ücretsiz)" : ""}
                </span>
                <span className="shrink-0 font-medium tabular-nums text-amber-200/90">{formatTry(price.listingPackage.addTry)}</span>
              </li>
              <li className="flex justify-between gap-2 border-t border-white/10 pt-2 text-sm font-semibold text-white">
                <span>Toplam</span>
                <span className="tabular-nums text-amber-300">{formatTry(price.totalTry)}</span>
              </li>
            </ul>
          </div>
        )}
        <nav
          className="mx-auto mt-4 flex max-w-5xl snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin"
          aria-label="Adımlar"
        >
          {STEPS.map((s) => {
            const active = s.n === step;
            const done = s.n < step;
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => {
                  if (s.n < step) setStep(s.n);
                }}
                className={`flex snap-start shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                  active
                    ? "border-amber-400/50 bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/25"
                    : done
                      ? "border-white/10 bg-white/5 text-slate-300"
                      : "border-transparent text-slate-500"
                }`}
                disabled={s.n > step}
              >
                {done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <span className="w-3.5 text-center text-[10px]">{s.n}</span>}
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex min-h-0 flex-1 justify-center overflow-y-auto overscroll-y-contain px-3 pb-6 pt-5 sm:px-5 sm:pb-8 sm:pt-7">
        <div
          className="w-full max-w-3xl transition-[opacity,transform] duration-200 motion-reduce:transition-none"
          key={step}
        >
          {step === 1 && <Step1Intro onNext={goNext} />}

          {step === 2 && (
            <div className="space-y-6">
              {fieldErrors.general && <ErrorBanner text={fieldErrors.general} />}
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 shadow-2xl sm:p-7">
                <h3 className="font-serif text-lg font-semibold text-white">Temel bilgiler</h3>
                <p className="mt-1 text-sm text-slate-400">İletişim ve ön değerlendirme için. Bilgileriniz gizli tutulur.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Ad Soyad"
                    value={form.fullName}
                    onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
                    required
                  />
                  <Field
                    label="E-posta"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    required
                  />
                  <Field
                    className="sm:col-span-2"
                    label="WhatsApp (ülke kodu ile)"
                    value={form.whatsapp}
                    onChange={(v) => setForm((f) => ({ ...f, whatsapp: v }))}
                    placeholder="+90 ..."
                    required
                  />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <YesNo label="Pasaportunuz var mı?" v={form.hasPassport} onChange={(v) => setBool("hasPassport", v)} />
                  <YesNo
                    label="Daha önce yurtdışı tecrübeniz oldu mu?"
                    v={form.hasAbroadExperience}
                    onChange={(v) => setBool("hasAbroadExperience", v)}
                  />
                  <YesNo
                    label="Yabancı dil biliyor musunuz?"
                    v={form.knowsForeignLanguage}
                    onChange={(v) => setBool("knowsForeignLanguage", v)}
                  />
                </div>
                {form.knowsForeignLanguage && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-amber-100/90">Dilleriniz</p>
                      <button
                        type="button"
                        onClick={addLanguage}
                        className="text-xs font-semibold text-amber-300/90 hover:text-amber-200"
                      >
                        + Dil ekle
                      </button>
                    </div>
                    {form.languages.map((row, i) => (
                      <div key={i} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-end">
                        <Field
                          label="Dil"
                          value={row.name}
                          onChange={(v) => updateLanguage(i, { name: v })}
                        />
                        <div className="sm:w-40">
                          <label className="text-[11px] font-medium text-slate-400">Seviye</label>
                          <select
                            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0a1220] px-3 py-2.5 text-sm"
                            value={row.level}
                            onChange={(e) => updateLanguage(i, { level: e.target.value })}
                          >
                            {LANGUAGE_LEVELS.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>
                        {form.languages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLanguage(i)}
                            className="shrink-0 text-xs text-rose-300 hover:text-rose-200"
                          >
                            Kaldır
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              {fieldErrors.profession && <ErrorBanner text={fieldErrors.profession} />}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
                <h3 className="font-serif text-lg font-semibold text-white">Mesleğinizi veya başvuru alanınızı seçin</h3>
                <p className="mt-1 text-sm text-slate-400">Tek seçim. Arama ile hızlıca bulun.</p>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-[#0a1220] py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500"
                    placeholder="Ara..."
                    value={profQuery}
                    onChange={(e) => setProfQuery(e.target.value)}
                  />
                </div>
                <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                  {filteredProfessions.map((p) => {
                    const selected = form.professionId === p.id;
                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-sm leading-relaxed transition ${
                          selected
                            ? "border-amber-400/50 bg-amber-500/10 ring-1 ring-amber-400/20"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        <input
                          type="radio"
                          className="mt-0.5"
                          checked={selected}
                          onChange={() => setForm((f) => ({ ...f, professionId: p.id }))}
                        />
                        <span className="min-w-0 flex-1 text-slate-100">
                          {p.group === "demand" ? (
                            <span className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-2">
                              <span className="inline-flex w-fit items-center gap-1.5">
                                <span className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.2em] text-amber-200/95">
                                  TALEP
                                </span>
                                <span className="text-slate-500" aria-hidden>
                                  •
                                </span>
                                <span className="text-[15px] font-medium text-white">{p.main}</span>
                              </span>
                              <span className="text-xs font-medium text-amber-200/80">(yüksek talep)</span>
                            </span>
                          ) : (
                            <span>{p.label}</span>
                          )}
                        </span>
                        {selected && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-amber-300" aria-hidden />}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              {fieldErrors.countries && <ErrorBanner text={fieldErrors.countries} />}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
                <h3 className="font-serif text-lg font-semibold text-white">Hedef ülke / bölge</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Birden fazla seçebilirsiniz. <strong className="text-amber-200/90">İlk hedef</strong> temel hizmete dahildir. Her ek
                  ülke veya bölge <strong>+{YURTDISI_BASVURU_EXTRA_COUNTRY_TRY} TL</strong>.
                </p>
                <p className="mt-2 text-xs text-slate-500">Avrupa: Malta hariç liste. Ayrıca seçilebilir uluslararası hedefler.</p>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-[#0a1220] py-3 pl-10 pr-4 text-sm text-white"
                    placeholder="Ülke veya bölge ara…"
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                  />
                </div>
                {form.countryKeys.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {form.countryKeys.map((k) => {
                      const tMeta = targetMetaByKey(k);
                      return (
                        <li
                          key={k}
                          className="inline-flex max-w-full min-h-[32px] items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 py-1 pl-1.5 pr-2 text-xs text-amber-100 sm:py-1.5"
                        >
                          {tMeta ? (
                            <TargetCountryFlagOrIso flagEmoji={tMeta.flagEmoji} iso2={tMeta.iso2} size="sm" />
                          ) : null}
                          <span className="min-w-0 max-w-[12rem] truncate sm:max-w-[16rem]">{tMeta?.nameTr ?? k}</span>
                          <button
                            type="button"
                            className="ml-0.5 shrink-0 rounded p-0.5 hover:bg-white/10"
                            onClick={() => toggleCountry(k)}
                            aria-label="Kaldır"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="mt-4 max-h-[42vh] space-y-4 overflow-y-auto pr-0.5">
                  {filteredEurope.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Avrupa</h4>
                      <div className="mt-2 grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {filteredEurope.map((c) => {
                          const on = form.countryKeys.includes(c.key);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCountry(c.id)}
                              className={`flex min-h-[44px] w-full min-w-0 items-center gap-3 overflow-visible rounded-xl border px-2 py-2 text-left text-sm sm:px-3 ${
                                on
                                  ? "border-amber-400/50 bg-amber-500/10 text-white ring-1 ring-amber-400/15"
                                  : "border-white/10 text-slate-200 hover:border-white/25"
                              }`}
                            >
                              <TargetCountryFlagOrIso flagEmoji={c.flagEmoji} iso2={c.iso2} />
                              <span className="min-w-0 flex-1 leading-snug">{c.nameTr}</span>
                              {on && <Check className="ml-auto h-4 w-4 shrink-0 text-amber-300" aria-hidden />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {filteredInternational.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Diğer hedefler</h4>
                      <div className="mt-2 grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {filteredInternational.map((c) => {
                          const on = form.countryKeys.includes(c.key);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCountry(c.id)}
                              className={`flex min-h-[44px] w-full min-w-0 items-center gap-3 overflow-visible rounded-xl border px-2 py-2 text-left text-sm sm:px-3 ${
                                on
                                  ? "border-amber-400/50 bg-amber-500/10 text-white ring-1 ring-amber-400/15"
                                  : "border-white/10 text-slate-200 hover:border-white/25"
                              }`}
                            >
                              <TargetCountryFlagOrIso flagEmoji={c.flagEmoji} iso2={c.iso2} />
                              <span className="min-w-0 flex-1 leading-snug">
                                {c.nameTr}
                                {c.type === "region" && (
                                  <span className="ml-1.5 text-[10px] font-medium text-slate-500">(bölge odağı)</span>
                                )}
                              </span>
                              {on && <Check className="ml-auto h-4 w-4 shrink-0 text-amber-300" aria-hidden />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-center text-sm text-amber-100/80">
                  Seçilen: {form.countryKeys.length} hedef · İlk hedef dahil · Ek: {extraCountries} × {YURTDISI_BASVURU_EXTRA_COUNTRY_TRY} TL
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              {fieldErrors.listing && <ErrorBanner text={fieldErrors.listing} />}
              <div className="grid gap-3 sm:grid-cols-2">
                {LISTING_PACKAGES.map((p) => {
                  const selected = form.listingPackageId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, listingPackageId: p.id }))}
                      className={`rounded-3xl border p-4 text-left transition ${
                        selected
                          ? "border-amber-400/50 bg-amber-500/10 ring-1 ring-amber-400/30"
                          : "border-white/10 bg-white/[0.04] hover:border-amber-500/20"
                      } ${p.id === 1 ? "sm:col-span-2" : ""}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-200/80">İlan paketi</p>
                      <p className="mt-1 font-serif text-lg font-semibold text-white">{p.label}</p>
                      {p.addTry === 0 ? (
                        <p className="mt-2 text-sm font-semibold text-emerald-300/95">Ücretsiz</p>
                      ) : (
                        <p className="mt-2 text-sm text-amber-200/90">+{p.addTry} TL</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              {fieldErrors.auth && <ErrorBanner text={fieldErrors.auth} />}
              {fieldErrors.cv && <ErrorBanner text={fieldErrors.cv} />}
              {authLoading ? (
                <p className="text-sm text-slate-400">Oturum kontrol ediliyor…</p>
              ) : !user ? (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                  <p className="text-sm text-slate-200">Belge yüklemek ve ödemeyi tamamlamak için giriş yapın.</p>
                  <Link
                    href={`/giris?next=${encodeURIComponent(YURTDISI_BASVURU_CANONICAL_PATH)}`}
                    className="mt-4 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-[#0f1a2c]"
                  >
                    Girişe git
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-[#0a1220] to-[#0a1220] p-4 shadow-[0_0_24px_rgba(245,158,11,0.08)] sm:p-5">
                    <p className="text-sm font-medium leading-relaxed text-amber-50/95 sm:text-[15px]">
                      Belgeleriniz yalnızca yetkili operasyon alanına yüklenir; herkese açık alanda paylaşılmaz.
                    </p>
                    <a
                      href="https://www.ilanlarcebimde.com/yurtdisi-cv-paketi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-300/95 hover:text-amber-200"
                    >
                      CV&apos;niz hazır değilse profesyonel CV oluşturma alanına geçin
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="space-y-3">
                    {DOC_CATEGORY_KEYS.map((cat) => {
                      const hasFile = form.filesByCategory[cat].length > 0;
                      return (
                        <div
                          key={cat}
                          className={`min-h-[10rem] rounded-2xl border p-4 transition-colors sm:min-h-[8.5rem] ${
                            hasFile
                              ? "border-emerald-500/45 bg-emerald-950/25 shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_0_20px_rgba(16,185,129,0.08)]"
                              : "border-dashed border-white/15 bg-white/[0.03]"
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => onFileDrop(e, cat)}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="text-sm font-medium text-white">
                                {DOC_CATEGORY_LABELS[cat]}
                                {cat === "cv" && <span className="text-rose-300"> *</span>}
                              </p>
                              {hasFile && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                                  Yüklendi
                                </span>
                              )}
                            </div>
                            <label
                              className={`inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                                hasFile
                                  ? "border-emerald-500/30 bg-[#0a1220] text-emerald-100 hover:border-emerald-400/40"
                                  : "border-white/15 bg-[#0a1220] text-amber-100 hover:border-amber-500/30"
                              }`}
                            >
                              {uploading === cat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                              {uploading === cat ? "Yükleniyor…" : "Seç veya sürükle-bırak"}
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,image/*"
                                onChange={(e) => onUpload(cat, e.target.files)}
                              />
                            </label>
                          </div>
                          <p className="mt-2 text-[11px] text-slate-500">PDF, Word veya görsel — kartın üzerine bırakabilirsiniz.</p>
                          {form.filesByCategory[cat].length > 0 && (
                            <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                              {form.filesByCategory[cat].map((f) => (
                                <li key={f.path} className="flex min-w-0 items-center justify-between gap-2">
                                  <span className="min-w-0 max-w-full truncate" title={f.originalName}>
                                    {f.originalName}
                                  </span>
                                  <button
                                    type="button"
                                    className="shrink-0 text-rose-300 hover:underline"
                                    onClick={() => removeFile(cat, f.path)}
                                  >
                                    Kaldır
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 7 && <Step7Interview onBack={goBack} onNext={goNext} />}

          {step === 8 && (
            <div>
              {fieldErrors.legal && <ErrorBanner text={fieldErrors.legal} />}
              <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-slate-200">
                <p>
                  Devam etmek için hizmet şartları ve bilgilendirme metinlerini onaylamanız gerekir. Aşağıdaki bölümler arasında
                  düzenlendi; her madde ayrı onay ister.
                </p>
              </div>
              <div className="space-y-3">
                {LEGAL_CONSENT_GROUPS.map((g) => (
                  <details
                    key={g.id}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] open:border-amber-500/20 open:bg-amber-500/[0.04]"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 text-left [&::-webkit-details-marker]:hidden">
                      <div>
                        <p className="text-sm font-semibold text-white">{g.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{g.lead}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-amber-200/60 transition group-open:rotate-90" aria-hidden />
                    </summary>
                    <div className="space-y-3 border-t border-white/10 px-3 pb-4 pt-1 sm:px-4">
                      {g.keys.map((k) => {
                        const c = LEGAL_CONSENT_COPY[k];
                        return (
                          <div key={k} className="rounded-xl border border-white/5 bg-[#0a1220]/80 p-3">
                            <label className="flex items-start gap-2.5 text-sm text-white">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-[#0a1220]"
                                checked={form.legal[k]}
                                onChange={(e) =>
                                  setForm((f) => ({ ...f, legal: { ...f.legal, [k]: e.target.checked } }))
                                }
                              />
                              <span>
                                <span className="font-medium">{c.title}</span>
                                <span className="ml-1 text-xs text-slate-500">(okudum, kabul ediyorum)</span>
                              </span>
                            </label>
                            <p className="mt-2 pl-0 text-xs leading-relaxed text-slate-500 sm:pl-6">{c.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {step === 9 && (
            <div>
              {fieldErrors.inv && <ErrorBanner text={fieldErrors.inv} />}
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <h3 className="font-serif text-lg font-semibold text-white">Fatura (bireysel)</h3>
                <p className="mt-1 text-sm text-slate-400">Ödeme öncesi zorunlu. Bilgiler fatura kaydınızla eşleşir.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Ad"
                    value={form.invoiceFirstName}
                    onChange={(v) => setForm((f) => ({ ...f, invoiceFirstName: v }))}
                  />
                  <Field
                    label="Soyad"
                    value={form.invoiceLastName}
                    onChange={(v) => setForm((f) => ({ ...f, invoiceLastName: v }))}
                  />
                  <Field
                    label="Fatura e-postası (giriş e-postanızla aynı olmalı)"
                    type="email"
                    value={form.invoiceEmail}
                    onChange={(v) => setForm((f) => ({ ...f, invoiceEmail: v }))}
                    className="sm:col-span-2"
                  />
                  <Field
                    label="Telefon"
                    value={form.invoicePhone}
                    onChange={(v) => setForm((f) => ({ ...f, invoicePhone: v }))}
                  />
                  <Field
                    label="T.C. Kimlik (opsiyonel)"
                    value={form.invoiceTckn}
                    onChange={(v) => setForm((f) => ({ ...f, invoiceTckn: v }))}
                  />
                  <Field label="İl" value={form.invoiceCity} onChange={(v) => setForm((f) => ({ ...f, invoiceCity: v }))} />
                  <Field
                    label="İlçe"
                    value={form.invoiceDistrict}
                    onChange={(v) => setForm((f) => ({ ...f, invoiceDistrict: v }))}
                  />
                  <Field
                    label="Posta kodu"
                    value={form.invoicePostal}
                    onChange={(v) => setForm((f) => ({ ...f, invoicePostal: v }))}
                  />
                  <Field
                    className="sm:col-span-2"
                    label="Adres"
                    value={form.invoiceAddress}
                    onChange={(v) => setForm((f) => ({ ...f, invoiceAddress: v }))}
                  />
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-500">Fatura notu (opsiyonel)</label>
                    <textarea
                      className="mt-1 w-full min-h-[80px] rounded-2xl border border-white/10 bg-[#0a1220] px-3 py-2.5 text-sm"
                      value={form.invoiceNote}
                      onChange={(e) => setForm((f) => ({ ...f, invoiceNote: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-4">
              {payError && <ErrorBanner text={payError} />}
              {price && pricingInput && (
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <h3 className="font-serif text-lg font-semibold text-white">Ödeme özeti</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
                    <li>• Meslek: {form.professionId ? professionLabelById(form.professionId) : "—"}</li>
                    <li>• Hedefler: {form.countryKeys.map((k) => targetDisplayWithFlag(k)).join(" · ")}</li>
                    <li>• İlan paketi: {price.listingPackage.label}</li>
                  </ul>
                  <ul className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm">
                    {price.lineItems.map((l) => (
                      <li key={l.code} className="flex justify-between text-slate-200">
                        <span>{l.label}</span>
                        <span className="tabular-nums text-amber-200">{formatTry(l.amountTry)}</span>
                      </li>
                    ))}
                    <li className="mt-2 flex justify-between text-base font-bold text-white">
                      <span>Toplam</span>
                      <span className="tabular-nums text-amber-300">{formatTry(price.totalTry)}</span>
                    </li>
                  </ul>
                </div>
              )}

              {!payIframe && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <label htmlFor="basvuru-checkout-coupon" className="text-xs font-medium text-slate-400">
                      Kupon kodu (opsiyonel)
                    </label>
                    <input
                      id="basvuru-checkout-coupon"
                      type="text"
                      autoComplete="off"
                      value={checkoutCoupon}
                      onChange={(e) => setCheckoutCoupon(e.target.value)}
                      placeholder="Tanımlı kupon kodunuzu giriniz"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#0a1220] px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
                    />
                    {isAdminBasvuruFreeUnlimitedActive(checkoutCoupon) && (
                      <p className="mt-2 text-xs leading-relaxed text-emerald-200/90">
                        Bu kod ile PayTR atlanır; ödeme sunucuda anında tamamlanır (yalnızca geliştirme veya
                        sunucu/ortam değişkeni açıkken).
                      </p>
                    )}
                    {isAdminBasvuruFreeUnlimitedCoupon(checkoutCoupon) && !isAdminBasvuruFreeUnlimitedActive(checkoutCoupon) && (
                        <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
                          Bu test kuponu bu ortamda tanımlı değil; normal tutarla PayTR ödemesi yapılır. Açmak için
                          sunucuda <code className="rounded bg-white/10 px-1">ALLOW_ADMIN_BASVURU_FREE_COUPON</code> ve
                          production’da istemcinin 0₺ tutarı gönderebilmesi için{" "}
                          <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_ALLOW_ADMIN_BASVURU_FREE_COUPON</code>{" "}
                          (ör. <code className="rounded bg-white/10 px-1">true</code>) ayarlayın.
                        </p>
                      )}
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPayError(null);
                        void startPaytr();
                      }}
                      className="inline-flex min-h-[52px] min-w-[200px] items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-[#0f1a2c] shadow-lg shadow-amber-900/30"
                    >
                      <Shield className="h-4 w-4" />
                      {isAdminBasvuruFreeUnlimitedActive(checkoutCoupon) ? "Test ödemesini tamamla" : "PAYTR ile ödemeye geç"}
                    </button>
                  </div>
                </div>
              )}

              {payIframe && (
                <div className="space-y-2">
                  <p className="text-center text-xs text-slate-400">Güvenli ödeme penceresi — işlemi burada tamamlayın.</p>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                    <iframe title="PAYTR ödeme" src={payIframe} className="h-[640px] w-full" />
                  </div>
                </div>
              )}
            </div>
          )}

          {step < 10 && step !== 1 && step !== 7 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Geri
              </button>
              {step < 9 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-amber-500/90 px-5 py-2.5 text-sm font-semibold text-[#0f1a2c] hover:bg-amber-400"
                >
                  Devam
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {step === 9 && (
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep(9)) setStep(10);
                  }}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-amber-500/90 px-5 py-2.5 text-sm font-semibold text-[#0f1a2c] hover:bg-amber-400"
                >
                  Özeti göster
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Step1Intro({ onNext }: { onNext: () => void }) {
  const bullets = [
    "Hedefe uygun iş ilanlarını tarar; çalışma odağınızla önceliklendirir.",
    "İletişim bilgileri üzerinden alanınıza uygun başvuru hazırlığını organize eder.",
    "CV / özgeçmişinizi hedef ülkeye uygun biçimde çeviri ve formata yaklaştırır.",
    "İş başvuru mektubu ve CV iletişimini kurallı, profesyonel bir dille ilerletir.",
    "Firma olumlu dönüş verirse mülakat için tarih ve saat yönlendirmesini size iletir.",
    "Başvurulan ilanlara ait linkler ve ekran görüntüleri süreç boyunca sizinle paylaşılır.",
  ];
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-white/[0.08] to-[#0a1220] p-5 shadow-2xl sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">Profesyonel başlangıç</p>
        <h3 className="mt-2 font-serif text-xl font-semibold text-white sm:text-2xl">Hizmetinizde ne var?</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-300/95">
          Bu hizmet; yurtdışı işe başvuru sürecinizi uçtan uca tek çatıda toplar. Sonuç iddiası değil, kontrollü ve şeffaf bir
          süreç yönetimi modeli.
        </p>
        <ul className="mt-6 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 text-sm text-slate-200/90">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-[10px] font-bold text-amber-200">
                <Check className="h-3 w-3" />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <p className="text-xs text-slate-500">Tahmini süre: 6–9 dakika · Ara verebilir, geri adımlara dönebilirsiniz.</p>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-amber-500/90 px-6 py-2.5 text-sm font-semibold text-[#0f1a2c] hover:bg-amber-400"
        >
          Devam
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Step7Interview({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-indigo-500/10 to-transparent p-5 sm:p-6">
        <h3 className="font-serif text-lg font-semibold text-white sm:text-xl">Mülakat olursa dil desteğini nasıl çözebilirsiniz?</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-300/95">
          Mülakat ve iletişim performansı size aittir. Aşağıdaki seçenekler yalnızca yardımcı rehber niteliğindedir.
        </p>
        <ul className="mt-5 space-y-3 text-sm text-slate-200/90">
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
            <span>Anlık çeviri uygulamaları ile hazırlık</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
            <span>Ayrı cihazda yardımcı çeviri kullanımı</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
            <span>Bağımsız profesyonel tercüman desteği</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
            <span>Tanıdık / eş–dost veya serbest tercüman desteği</span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">Bu bölüm taahhüt değil, yalnızca yardımcı seçenek özetidir.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-amber-500/90 px-5 py-2.5 text-sm font-semibold text-[#0f1a2c] hover:bg-amber-400"
        >
          Anladım, devam
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  placeholder = "",
  required: _r,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0a1220] px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
      />
    </div>
  );
}

function YesNo({ label, v, onChange }: { label: string; v: boolean | null; onChange: (b: boolean) => void }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`min-h-[44px] flex-1 rounded-2xl border px-2 text-xs font-semibold ${
            v === true ? "border-amber-400/50 bg-amber-500/15 text-amber-100" : "border-white/10 text-slate-300"
          }`}
        >
          Evet
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`min-h-[44px] flex-1 rounded-2xl border px-2 text-xs font-semibold ${
            v === false ? "border-amber-400/50 bg-amber-500/15 text-amber-100" : "border-white/10 text-slate-300"
          }`}
        >
          Hayır
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ text }: { text: string }) {
  return (
    <div
      className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {text}
    </div>
  );
}
