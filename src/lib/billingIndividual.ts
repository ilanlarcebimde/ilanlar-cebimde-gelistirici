/**
 * Bireysel fatura formu — ödeme öncesi toplanır; PayTR initiate ve kupon finalize API’leri doğrular.
 */

export type IndividualBillingPricing = {
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  coupon_code?: string | null;
};

export type IndividualBillingPayload = {
  /** Ödeme ekranındaki `basket_description` ile birebir aynı olmalı */
  service_name: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  district: string;
  postal_code: string;
  email: string;
  phone: string;
  tckn?: string | null;
  invoice_note?: string | null;
  confirm_invoice_accuracy: boolean;
  confirm_terms: boolean;
  pricing: IndividualBillingPricing;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export function validateIndividualBillingPayload(
  raw: unknown,
  options: { paytrEmail?: string | null; skipPaytrEmailMatch?: boolean }
): { ok: true; data: IndividualBillingPayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Geçersiz fatura verisi." };
  }
  const o = raw as Record<string, unknown>;

  const service_name = typeof o.service_name === "string" ? o.service_name.trim() : "";
  const first_name = typeof o.first_name === "string" ? o.first_name.trim() : "";
  const last_name = typeof o.last_name === "string" ? o.last_name.trim() : "";
  const address_line1 = typeof o.address_line1 === "string" ? o.address_line1.trim() : "";
  const address_line2 =
    typeof o.address_line2 === "string" && o.address_line2.trim() ? o.address_line2.trim() : null;
  const city = typeof o.city === "string" ? o.city.trim() : "";
  const district = typeof o.district === "string" ? o.district.trim() : "";
  const postal_code = typeof o.postal_code === "string" ? o.postal_code.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim().toLowerCase() : "";
  const phoneRaw = typeof o.phone === "string" ? o.phone.trim() : "";
  const phone = digitsOnly(phoneRaw);
  const tcknRaw = typeof o.tckn === "string" && o.tckn.trim() ? o.tckn.trim() : "";
  const invoice_note =
    typeof o.invoice_note === "string" && o.invoice_note.trim() ? o.invoice_note.trim().slice(0, 500) : null;
  const confirm_invoice_accuracy = o.confirm_invoice_accuracy === true;
  const confirm_terms = o.confirm_terms === true;

  if (!service_name || service_name.length > 200) {
    return { ok: false, error: "Hizmet adı eksik veya geçersiz." };
  }
  if (!first_name || first_name.length > 80) return { ok: false, error: "Ad zorunludur (en fazla 80 karakter)." };
  if (!last_name || last_name.length > 80) return { ok: false, error: "Soyad zorunludur (en fazla 80 karakter)." };
  if (!address_line1 || address_line1.length > 300) {
    return { ok: false, error: "Fatura adresi (satır 1) zorunludur." };
  }
  if (!city || city.length > 80) return { ok: false, error: "İl zorunludur." };
  if (!district || district.length > 80) return { ok: false, error: "İlçe zorunludur." };
  if (!postal_code || postal_code.length < 3 || postal_code.length > 10) {
    return { ok: false, error: "Posta kodu geçerli değil." };
  }
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "Geçerli bir e-posta girin." };
  if (
    !options.skipPaytrEmailMatch &&
    options.paytrEmail &&
    email !== options.paytrEmail.trim().toLowerCase()
  ) {
    return { ok: false, error: "Fatura e-postası, ödeme için kullanılan e-posta ile aynı olmalıdır." };
  }
  if (phone.length < 10 || phone.length > 15) {
    return { ok: false, error: "Telefon numarası en az 10 rakam olmalıdır." };
  }
  if (tcknRaw) {
    const t = digitsOnly(tcknRaw);
    if (t.length !== 11) return { ok: false, error: "T.C. Kimlik numarası 11 haneli olmalıdır." };
  }
  if (!confirm_invoice_accuracy) {
    return { ok: false, error: "Fatura doğruluğu onayını işaretlemeniz gerekir." };
  }
  if (!confirm_terms) {
    return { ok: false, error: "Ön bilgilendirme ve KVKK onayını işaretlemeniz gerekir." };
  }

  const pr = o.pricing;
  if (!pr || typeof pr !== "object") {
    return { ok: false, error: "Tutar bilgisi eksik." };
  }
  const prObj = pr as Record<string, unknown>;
  const gross = Number(prObj.gross_amount);
  const discount = Number(prObj.discount_amount);
  const net = Number(prObj.net_amount);
  if (!Number.isFinite(gross) || !Number.isFinite(discount) || !Number.isFinite(net)) {
    return { ok: false, error: "Tutar bilgisi geçersiz." };
  }
  const coupon_code =
    typeof prObj.coupon_code === "string" && prObj.coupon_code.trim() ? prObj.coupon_code.trim() : null;

  const data: IndividualBillingPayload = {
    service_name,
    first_name,
    last_name,
    address_line1,
    address_line2,
    city,
    district,
    postal_code,
    email,
    phone,
    tckn: tcknRaw ? digitsOnly(tcknRaw) : null,
    invoice_note,
    confirm_invoice_accuracy,
    confirm_terms,
    pricing: {
      gross_amount: gross,
      discount_amount: discount,
      net_amount: net,
      coupon_code,
    },
  };
  return { ok: true, data };
}

/** initiate isteğindeki tutar / sepet ile fatura özeti uyumu (sunucu tarafı). */
export function assertBillingMatchesPaytrInitiate(
  billing: IndividualBillingPayload,
  opts: { amount: number; basket_description: string }
): { ok: true } | { ok: false; error: string } {
  const basket = opts.basket_description.trim();
  if (billing.service_name !== basket) {
    return { ok: false, error: "Fatura satırı ile sepet adı uyuşmuyor." };
  }
  if (Math.abs(Number(billing.pricing.net_amount) - Number(opts.amount)) > 0.009) {
    return { ok: false, error: "Fatura tutarı ile ödeme tutarı uyuşmuyor." };
  }
  const g = Number(billing.pricing.gross_amount);
  const d = Number(billing.pricing.discount_amount);
  const n = Number(billing.pricing.net_amount);
  if (!Number.isFinite(g) || !Number.isFinite(d) || !Number.isFinite(n)) {
    return { ok: false, error: "Tutar bilgisi geçersiz." };
  }
  if (Math.abs(g - d - n) > 0.02) {
    return { ok: false, error: "Brüt / indirim / net tutarları tutarsız." };
  }
  return { ok: true };
}
