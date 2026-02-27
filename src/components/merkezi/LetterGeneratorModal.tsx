"use client";

import { useState } from "react";

interface LetterGeneratorModalProps {
  postId: string;
  open: boolean;
  onClose: () => void;
  /** 401/403 (premium gerekli) dönerse çağrılır; parent upsell modal açabilir */
  onPremiumRequired?: () => void;
}

type Tab = "tr" | "en";

export function LetterGeneratorModal({ postId, open, onClose, onPremiumRequired }: LetterGeneratorModalProps) {
  const [fullName, setFullName] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [role, setRole] = useState("");
  const [englishLevel, setEnglishLevel] = useState("");
  const [hasPassport, setHasPassport] = useState(true);
  const [hasVisa, setHasVisa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    letter_en: string;
    letter_tr: string;
    subject_en?: string;
    subject_tr?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tr");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/merkezi/post/${postId}/letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: fullName || undefined,
          experience_years: experienceYears ? parseInt(experienceYears, 10) : undefined,
          role: role || undefined,
          english_level: englishLevel || undefined,
          has_passport: hasPassport,
          has_visa: hasVisa,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if ((res.status === 401 || res.status === 403) && onPremiumRequired) {
          onPremiumRequired();
          onClose();
          return;
        }
        setError(data.error || "Mektup oluşturulamadı");
        return;
      }
      setResult({
        letter_en: data.letter_en ?? "",
        letter_tr: data.letter_tr ?? "",
        subject_en: data.subject_en,
        subject_tr: data.subject_tr,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="letter-modal-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="letter-modal-title" className="text-xl font-bold text-slate-900">
          İş Başvuru Mektubu Oluştur
        </h2>

        {!result ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Deneyim (yıl)</label>
              <input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Meslek / Rol</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">İngilizce seviyesi</label>
              <select
                value={englishLevel}
                onChange={(e) => setEnglishLevel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Seçiniz</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={hasPassport}
                  onChange={(e) => setHasPassport(e.target.checked)}
                />
                Pasaport var
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={hasVisa}
                  onChange={(e) => setHasVisa(e.target.checked)}
                />
                Vize var
              </label>
            </div>
            {error && (
              <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {loading ? "Oluşturuluyor…" : "Mektup Oluştur"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                İptal
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4">
            <div className="flex gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("tr")}
                className={`border-b-2 px-3 py-2 text-sm font-medium ${activeTab === "tr" ? "border-slate-800 text-slate-900" : "border-transparent text-slate-500"}`}
              >
                Türkçe
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("en")}
                className={`border-b-2 px-3 py-2 text-sm font-medium ${activeTab === "en" ? "border-slate-800 text-slate-900" : "border-transparent text-slate-500"}`}
              >
                İngilizce
              </button>
            </div>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-wrap">
              {activeTab === "tr" ? result.letter_tr : result.letter_en}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(activeTab === "tr" ? result.letter_tr : result.letter_en)}
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Kopyala
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
