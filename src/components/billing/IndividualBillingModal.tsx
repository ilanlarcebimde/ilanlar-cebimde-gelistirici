"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IndividualBillingPayload } from "@/lib/billingIndividual";
import type { OdemeCheckoutPricing } from "@/lib/odemePaytrPendingPricing";

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export type IndividualBillingModalProps = {
  open: boolean;
  onClose: () => void;
  /** PayTR / oturum e-postası — fatura e-postası bununla aynı olmalı */
  paytrEmail: string;
  pricing: OdemeCheckoutPricing;
  onSave: (payload: IndividualBillingPayload) => Promise<void>;
  /** true iken kapatmada onay sor */
  warnOnClose?: boolean;
};

const fmtTry = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";

export function IndividualBillingModal({
  open,
  onClose,
  paytrEmail,
  pricing,
  onSave,
  warnOnClose = true,
}: IndividualBillingModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [postal, setPostal] = useState("");
  const [phone, setPhone] = useState("");
  const [tckn, setTckn] = useState("");
  const [note, setNote] = useState("");
  const [confirmAcc, setConfirmAcc] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => {
    return (
      firstName.trim() ||
      lastName.trim() ||
      address1.trim() ||
      address2.trim() ||
      city.trim() ||
      district.trim() ||
      postal.trim() ||
      phone.trim() ||
      tckn.trim() ||
      note.trim() ||
      confirmAcc ||
      confirmTerms
    );
  }, [firstName, lastName, address1, address2, city, district, postal, phone, tckn, note, confirmAcc, confirmTerms]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
  }, [open, pricing.serviceName, pricing.netAmount]);

  const handleClose = useCallback(() => {
    if (warnOnClose && dirty && !saving) {
      const ok = window.confirm("Kaydedilmemiş bilgiler kaybolabilir. Kapatmak istiyor musunuz?");
      if (!ok) return;
    }
    onClose();
  }, [warnOnClose, dirty, saving, onClose]);

  const submit = async () => {
    setError(null);
    const email = paytrEmail.trim().toLowerCase();
    if (!firstName.trim()) {
      setError("Ad zorunludur.");
      return;
    }
    if (!lastName.trim()) {
      setError("Soyad zorunludur.");
      return;
    }
    if (!address1.trim()) {
      setError("Fatura adresi zorunludur.");
      return;
    }
    if (!city.trim()) {
      setError("İl zorunludur.");
      return;
    }
    if (!district.trim()) {
      setError("İlçe zorunludur.");
      return;
    }
    if (!postal.trim() || postal.trim().length < 3) {
      setError("Posta kodu geçerli değil.");
      return;
    }
    const ph = digitsOnly(phone);
    if (ph.length < 10) {
      setError("Telefon numarası en az 10 rakam olmalıdır.");
      return;
    }
    if (tckn.trim() && digitsOnly(tckn).length !== 11) {
      setError("T.C. Kimlik numarası 11 haneli olmalıdır.");
      return;
    }
    if (!confirmAcc) {
      setError("Fatura doğruluğu onayını işaretleyin.");
      return;
    }
    if (!confirmTerms) {
      setError("Ön bilgilendirme ve KVKK onayını işaretleyin.");
      return;
    }
    const payload: IndividualBillingPayload = {
      service_name: pricing.serviceName,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      address_line1: address1.trim(),
      address_line2: address2.trim() || null,
      city: city.trim(),
      district: district.trim(),
      postal_code: postal.trim(),
      email,
      phone: ph,
      tckn: tckn.trim() ? digitsOnly(tckn) : null,
      invoice_note: note.trim() || null,
      confirm_invoice_accuracy: true,
      confirm_terms: true,
      pricing: {
        gross_amount: pricing.grossAmount,
        discount_amount: pricing.discountAmount,
        net_amount: pricing.netAmount,
        coupon_code: pricing.couponCode,
      },
    };
    setSaving(true);
    try {
      await onSave(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-modal-title"
    >
      <div
        className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:max-h-[85vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 id="billing-modal-title" className="text-lg font-semibold text-slate-900">
            Fatura Bilgileri
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ödeme sonrası belgenizi düzenleyebilmemiz için bu bilgiler gereklidir.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
          <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
            Yasal olarak faaliyet göstermekteyiz. Fatura kesilmesi için bu bilgiler gereklidir. Her zaman bizimle
            iletişim kurabilirsiniz: WhatsApp{" "}
            <a href="https://wa.me/905011421052" className="font-medium text-slate-900 underline">
              +90 501 142 10 52
            </a>
            . Hizmetin arkasındayız.
          </p>

          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900">
            Bu bilgiler yalnızca satın alma ve belge süreçleri için kullanılır.
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
            <p className="font-medium text-slate-900">Hizmet özeti</p>
            <p className="mt-1 text-slate-700">{pricing.serviceName}</p>
            <div className="mt-2 space-y-0.5 text-xs text-slate-600">
              <div className="flex justify-between gap-2">
                <span>Liste / brüt</span>
                <span>{fmtTry(pricing.grossAmount)}</span>
              </div>
              {pricing.discountAmount > 0 ? (
                <div className="flex justify-between gap-2 text-amber-800">
                  <span>İndirim / kupon</span>
                  <span>− {fmtTry(pricing.discountAmount)}</span>
                </div>
              ) : null}
              {pricing.couponCode ? (
                <div className="flex justify-between gap-2 text-slate-500">
                  <span>Kupon kodu</span>
                  <span className="font-mono text-[11px]">{pricing.couponCode}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-2 border-t border-slate-200 pt-2 font-semibold text-slate-900">
                <span>Ödenecek net</span>
                <span>{fmtTry(pricing.netAmount)}</span>
              </div>
            </div>
          </div>

          <p className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
            Bireysel fatura — kurumsal fatura talep etmiyorum
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-1">
              <span className="text-xs font-medium text-slate-700">Ad *</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                autoComplete="given-name"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-xs font-medium text-slate-700">Soyad *</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                autoComplete="family-name"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-700">Fatura adresi (satır 1) *</span>
              <input
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                autoComplete="street-address"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-700">Adres satırı 2</span>
              <input
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">İl *</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                autoComplete="address-level1"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">İlçe *</span>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                autoComplete="address-level2"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Posta kodu *</span>
              <input
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                autoComplete="postal-code"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Telefon *</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-700">E-posta *</span>
              <input
                value={paytrEmail}
                readOnly
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
              <span className="mt-0.5 block text-[11px] text-slate-500">Ödeme ile aynı e-posta kullanılır.</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-700">T.C. Kimlik No (isteğe bağlı)</span>
              <input
                value={tckn}
                onChange={(e) => setTckn(digitsOnly(e.target.value).slice(0, 11))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                inputMode="numeric"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-700">Fatura notu</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
          </div>

          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={confirmAcc}
              onChange={(e) => setConfirmAcc(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
            />
            <span>Fatura bilgilerimin doğru ve bana ait olduğunu onaylıyorum.</span>
          </label>

          <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={confirmTerms}
              onChange={(e) => setConfirmTerms(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
            />
            <span>
              Ön bilgilendirme, mesafeli satış ve KVKK metinlerini okudum, kabul ediyorum. (
              <Link href="/mesafeli-satis-sozlesmesi" className="underline" target="_blank" rel="noopener noreferrer">
                Mesafeli satış
              </Link>
              {" · "}
              <Link href="/gizlilik-politikasi" className="underline" target="_blank" rel="noopener noreferrer">
                KVKK / Gizlilik
              </Link>
              {" · "}
              <Link href="/hizmet-sozlesmesi" className="underline" target="_blank" rel="noopener noreferrer">
                Hizmet sözleşmesi
              </Link>
              )
            </span>
          </label>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            Geri
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="flex-[1.4] rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet ve Ödemeye Devam Et"}
          </button>
        </div>
      </div>
    </div>
  );
}
