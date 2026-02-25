"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isGuideResponse, type GuideBlock, type GuideResponse } from "@/components/GuideRenderer";

/** Full job record from DB (job_posts row). */
export type FullJob = Record<string, unknown> & {
  id?: string;
  title?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  location_text?: string | null;
  [key: string]: unknown;
};

export type Derived = {
  source_key: string;
  country: string | null;
  country_code: string | null;
};

const COUNTRY_TO_CODE: Record<string, string> = {
  ireland: "IE",
  germany: "DE",
  netherlands: "NL",
  france: "FR",
  spain: "ES",
  italy: "IT",
  portugal: "PT",
  belgium: "BE",
  austria: "AT",
  sweden: "SE",
  denmark: "DK",
  norway: "NO",
  switzerland: "CH",
  "united kingdom": "GB",
  uk: "GB",
  "united states": "US",
  usa: "US",
  america: "US",
  canada: "CA",
  australia: "AU",
};

function deriveSourceKey(sourceName: string | null | undefined): string {
  const s = (sourceName ?? "").toLowerCase().trim();
  if (s.includes("eures")) return "EURES";
  if (s.includes("glassdoor")) return "GLASSDOOR";
  if (s.includes("linkedin")) return "LINKEDIN";
  if (s.includes("indeed")) return "INDEED";
  if (s.includes("jooble")) return "JOOBLE";
  if (s.includes("kariyer") || s.includes("career") || s.includes("company")) return "COMPANY_CAREER";
  return "OTHER";
}

function deriveCountryAndCode(job: FullJob): { country: string | null; country_code: string | null } {
  const rawCountry = (job.country as string)?.trim();
  if (rawCountry) {
    const key = rawCountry.toLowerCase();
    const code = COUNTRY_TO_CODE[key] ?? null;
    return { country: rawCountry, country_code: code };
  }
  const locationText = (job.location_text as string)?.trim() ?? "";
  const part = locationText.split(":")[0]?.trim() ?? "";
  if (!part) return { country: null, country_code: null };
  const key = part.toLowerCase();
  const code = COUNTRY_TO_CODE[key] ?? null;
  return { country: part, country_code: code };
}

function getStep1Question(sourceKey: string): string {
  switch (sourceKey) {
    case "EURES":
      return "EURES üzerinden başvuruyu sizin için resmi adımlarla hazırlayalım mı?";
    case "GLASSDOOR":
      return "Bu ilan için platform üzerinden başvuru adımlarını sizin için çıkaralım mı?";
    case "LINKEDIN":
    case "INDEED":
    case "JOOBLE":
      return "Bu ilan için platform başvurusu + şirket başvuru linki kontrolü yapalım mı?";
    default:
      return "Bu ilan için platform başvurusu + şirket başvuru linki kontrolü yapalım mı?";
  }
}

function getStepQuestion(step: number, _country: string | null): string {
  switch (step) {
    case 2:
      return "Bu ülke için gerekli belgeler ve başvurulacak kurumları sizin için derleyelim mi?";
    case 3:
      return "Vize/oturum sürecini adım adım çıkarmam için uygunluk durumunuzu netleştirelim mi?";
    case 4:
      return "Net maaşı gerçekçi hesaplamam için bazı bilgileri paylaşır mısınız?";
    case 5:
      return "Yaşam giderinizi şehir ve yaşam tarzınıza göre hesaplayalım mı?";
    case 6:
      return "Vize için kritik olan niyet mektubunu sizin bilgilerinizle taslaklayalım mı?";
    case 7:
      return "Son olarak size 30 günlük plan + risk kontrolü çıkaralım mı?";
    default:
      return "";
  }
}

function randomUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function TemplateBlockWithCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {}
    );
  }, [text]);
  return (
    <div className="mt-3">
      <pre className="overflow-x-auto rounded-lg bg-gray-50 p-4 font-mono text-sm leading-6 text-gray-700 whitespace-pre-wrap">
        {text}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {copied ? "Kopyalandı!" : "Kopyala"}
      </button>
    </div>
  );
}

function SectionCardBlock({ block }: { block: GuideBlock }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {block.heading ? (
        <h3 className="text-base font-semibold text-gray-900">{block.heading}</h3>
      ) : null}
      {block.type === "bullets" && (block.items ?? []).length > 0 ? (
        <ul className="mt-3 space-y-2">
          {(block.items ?? []).map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs text-blue-700">
                ✓
              </span>
              <span className="text-sm leading-6 text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {block.type === "text" && (block.text ?? "") ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{block.text ?? ""}</p>
      ) : null}
      {block.type === "table" && block.rows && block.rows.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-100">
          <table className="min-w-full text-sm">
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="bg-gray-50 px-4 py-2 font-medium text-gray-700 align-top w-[40%]">{row.k}</td>
                  <td className="px-4 py-2 text-gray-600">{row.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {block.type === "template" && (block.text ?? "") ? (
        <TemplateBlockWithCopy text={block.text ?? ""} />
      ) : null}
    </section>
  );
}

function ConsultancySummaryPanel({
  job,
  derived,
  ctaUrl,
}: {
  job: FullJob | null;
  derived: Derived | null;
  ctaUrl: string | null;
}) {
  const title = (job?.title as string) ?? "İlan";
  const source = (job?.source_name as string) ?? "—";
  const location = (derived?.country as string) ?? (job?.location_text as string) ?? "—";

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="mb-1 text-xs text-gray-500">İlan Özeti</div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-xs text-gray-600">{source}</p>
        <p className="mt-1 text-xs text-gray-600">{location}</p>
      </div>
      {ctaUrl ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-1 text-xs text-gray-500">Resmi İlan Bağlantısı</div>
          <a
            className="break-words text-sm font-medium text-gray-900 hover:underline"
            href={ctaUrl}
            target="_blank"
            rel="noreferrer"
          >
            {ctaUrl}
          </a>
          <p className="mt-3 text-xs text-gray-500">Bağlantıyı açmadan önce alan adını kontrol edin.</p>
        </div>
      ) : null}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="mb-1 text-xs text-gray-500">Güvenlik Kontrolü</div>
        <p className="text-xs text-gray-600">
          İçerik resmi kaynaklardan derlenir. Başvuru öncesi ilan sayfasını mutlaka kontrol edin.
        </p>
      </div>
    </aside>
  );
}

const CHECKLIST_ITEMS = ["Belgeler", "Vize/Oturum", "Maaş", "Gider", "30 Gün Plan"];

function StepFormFields({
  step,
  stepFormData,
  setStepFormData,
  onSubmit,
  loading,
}: {
  step: number;
  stepFormData: Record<string, unknown>;
  setStepFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  onSubmit: () => void;
  loading: boolean;
}) {
  const set = (key: string, value: unknown) =>
    setStepFormData((prev) => ({ ...prev, [key]: value }));

  if (step === 3) {
    return (
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Vatandaşlık bölgesi</label>
          <div className="flex gap-2">
            {(["AB/AEA", "AB dışı"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("citizenship_region", opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.citizenship_region === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={stepFormData.has_valid_passport === true}
              onChange={(e) => set("has_valid_passport", e.target.checked)}
              className="rounded border-gray-300"
            />
            Geçerli pasaportum var
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={stepFormData.family_in_country === true}
              onChange={(e) => set("family_in_country", e.target.checked)}
              className="rounded border-gray-300"
            />
            Ülkede aile/bağ var
          </label>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : "Devam"}
        </button>
      </div>
    );
  }

  if (step === 4) {
    const known = stepFormData.gross_salary_known === true;
    return (
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Brüt maaş biliniyor mu?</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStepFormData((p) => ({ ...p, gross_salary_known: true }))}
              className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.gross_salary_known === true ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              Evet
            </button>
            <button
              type="button"
              onClick={() => setStepFormData((p) => ({ ...p, gross_salary_known: false }))}
              className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.gross_salary_known === false ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              Hayır
            </button>
          </div>
        </div>
        {known ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Brüt tutar</label>
              <input
                type="number"
                value={(stepFormData.gross_salary_amount as number) ?? ""}
                onChange={(e) => set("gross_salary_amount", e.target.value ? Number(e.target.value) : undefined)}
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Örn. 3500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ödeme periyodu</label>
              <div className="flex gap-2">
                {(["aylık", "saatlik"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set("pay_period", opt)}
                    className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.pay_period === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Deneyim seviyesi</label>
              <select
                value={(stepFormData.experience_level as string) ?? ""}
                onChange={(e) => set("experience_level", e.target.value || undefined)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Seçin</option>
                <option value="0-1 yıl">0-1 yıl</option>
                <option value="1-3">1-3</option>
                <option value="3-5">3-5</option>
                <option value="5+">5+</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Medeni durum</label>
              <div className="flex gap-2">
                {(["bekar", "evli"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set("marital_status", opt)}
                    className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.marital_status === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Çocuk sayısı</label>
              <input
                type="number"
                min={0}
                value={(stepFormData.children_count as number) ?? ""}
                onChange={(e) => set("children_count", e.target.value ? Number(e.target.value) : undefined)}
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : "Devam"}
        </button>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Konaklama</label>
          <div className="flex flex-wrap gap-2">
            {(["oda", "stüdyo", "1+1"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("housing", opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.housing === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Yaşam tarzı</label>
          <div className="flex flex-wrap gap-2">
            {(["ekonomik", "standart", "rahat"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("lifestyle", opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.lifestyle === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Şehir (opsiyonel)</label>
          <input
            type="text"
            value={(stepFormData.city_override as string) ?? ""}
            onChange={(e) => set("city_override", e.target.value || null)}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="İlan lokasyonu dışında şehir"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Ulaşım</label>
          <div className="flex gap-2">
            {(["toplu taşıma", "araba"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("transport", opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.transport === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Bakmakla yükümlü olduğunuz kişi sayısı</label>
          <input
            type="number"
            min={0}
            value={(stepFormData.dependents as number) ?? ""}
            onChange={(e) => set("dependents", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : "Devam"}
        </button>
      </div>
    );
  }

  if (step === 6) {
    const returnTies = (stepFormData.return_ties as string[]) ?? [];
    const toggleTie = (v: string) =>
      setStepFormData((p) => ({
        ...p,
        return_ties: returnTies.includes(v) ? returnTies.filter((t) => t !== v) : [...returnTies, v],
      }));
    return (
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Ad Soyad</label>
          <input
            type="text"
            value={(stepFormData.full_name as string) ?? ""}
            onChange={(e) => set("full_name", e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Şu anki ülke</label>
          <input
            type="text"
            value={(stepFormData.current_country as string) ?? ""}
            onChange={(e) => set("current_country", e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Meslek</label>
          <input
            type="text"
            value={(stepFormData.profession as string) ?? ""}
            onChange={(e) => set("profession", e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Deneyim (yıl)</label>
          <input
            type="number"
            min={0}
            value={(stepFormData.years_experience as number) ?? ""}
            onChange={(e) => set("years_experience", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Neden bu ülke? (1-2 cümle)</label>
          <textarea
            value={(stepFormData.why_country as string) ?? ""}
            onChange={(e) => set("why_country", e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Türkiye bağları (çoklu seçim)</label>
          <div className="flex flex-wrap gap-2">
            {(["aile", "mülk", "iş", "eğitim", "diğer"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleTie(opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${returnTies.includes(opt) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Hedef başlangıç (ay-yıl)</label>
          <input
            type="text"
            value={(stepFormData.start_date_target as string) ?? ""}
            onChange={(e) => set("start_date_target", e.target.value)}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Örn. 08.2026"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Pasaport no (opsiyonel)</label>
          <input
            type="text"
            value={(stepFormData.passport_no as string) ?? ""}
            onChange={(e) => set("passport_no", e.target.value.trim() || undefined)}
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Varsa girin"
          />
        </div>
        {(() => {
          const fn = (stepFormData.full_name as string)?.trim() ?? "";
          const cc = (stepFormData.current_country as string)?.trim() ?? "";
          const pr = (stepFormData.profession as string)?.trim() ?? "";
          const ye = stepFormData.years_experience;
          const yc = (stepFormData.why_country as string)?.trim() ?? "";
          const sd = (stepFormData.start_date_target as string)?.trim() ?? "";
          const step6Valid =
            fn.length > 0 &&
            cc.length > 0 &&
            pr.length > 0 &&
            (typeof ye === "number" || (ye !== undefined && ye !== "")) &&
            yc.length > 0 &&
            sd.length > 0;
          return (
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading || !step6Valid}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Gönderiliyor…" : "Devam"}
            </button>
          );
        })()}
      </div>
    );
  }

  if (step === 7) {
    return (
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Zaman aciliyeti</label>
          <div className="flex flex-wrap gap-2">
            {(["hemen", "1 ay içinde", "3 ay"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("timeline_urgency", opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.timeline_urgency === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Risk toleransı</label>
          <div className="flex flex-wrap gap-2">
            {(["düşük", "orta", "yüksek"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("risk_tolerance", opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.risk_tolerance === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Belge hazırlığı</label>
          <div className="flex flex-wrap gap-2">
            {(["hazır", "kısmen", "hazır değil"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("document_readiness", opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.document_readiness === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={stepFormData.cv_ready === true}
              onChange={(e) => set("cv_ready", e.target.checked)}
              className="rounded border-gray-300"
            />
            CV hazır
          </label>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Dil seviyesi</label>
          <div className="flex flex-wrap gap-2">
            {(["başlangıç", "orta", "iyi"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set("language_level", opt)}
                className={`rounded-lg border px-3 py-2 text-sm ${stepFormData.language_level === opt ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : "Devam"}
        </button>
      </div>
    );
  }

  return null;
}

export function HowToApplyWizardModal({
  open,
  onClose,
  jobId,
  accessToken,
  jobSourceUrl,
}: {
  open: boolean;
  onClose: () => void;
  jobId: string;
  accessToken: string;
  jobSourceUrl?: string | null;
}) {
  const [sessionId] = useState(() => randomUUID());
  const [currentStep, setCurrentStep] = useState(1);
  const [job, setJob] = useState<FullJob | null>(null);
  const [derived, setDerived] = useState<Derived | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [stepResult, setStepResult] = useState<Record<string, unknown> | null>(null);
  const [approved, setApproved] = useState<"yes" | "no" | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [nextStepLoading, setNextStepLoading] = useState(false);
  /** Form data for current step (steps 3–7). Merged into answers on submit. */
  const [stepFormData, setStepFormData] = useState<Record<string, unknown>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch full job when modal opens with jobId
  useEffect(() => {
    if (!open || !jobId || !accessToken) return;
    setFetchError(null);
    setJob(null);
    setDerived(null);
    setAnswers({});
    setStepFormData({});
    setCurrentStep(1);
    setStepResult(null);
    setApproved(null);
    setCanContinue(false);
    setWebhookError(null);

    let cancelled = false;
    setLoading(true);
    fetch(`/api/apply/full-job?job_id=${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({})) as FullJob | { error?: string; detail?: string };
        return { res, data };
      })
      .then(({ res, data }) => {
        if (cancelled) return;
        setLoading(false);
        if (res.status === 403 && data && typeof data === "object" && (data as { error?: string }).error === "premium_required") {
          const msg = (data as { detail?: string }).detail ?? "Haftalık premium aboneliğiniz yok veya süresi dolmuş. Erişim için yeniden abone olun.";
          setFetchError(msg);
          if (typeof window !== "undefined") window.dispatchEvent(new Event("premium-subscription-invalidate"));
          return;
        }
        if (data && typeof data === "object" && "id" in data && !("error" in data)) {
          const fullJob = data as FullJob;
          setJob(fullJob);
          const sourceKey = deriveSourceKey(fullJob.source_name as string);
          const { country, country_code } = deriveCountryAndCode(fullJob);
          setDerived({ source_key: sourceKey, country, country_code });
        } else {
          const err = data as { error?: string; detail?: string };
          setFetchError(err?.error === "Not found" ? "İlan bulunamadı." : err?.detail ?? "İlan yüklenemedi.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setFetchError("Bağlantı hatası. Tekrar deneyin.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, jobId, accessToken]);

  const questionText =
    currentStep === 1 && derived
      ? getStep1Question(derived.source_key)
      : getStepQuestion(currentStep, derived?.country ?? null);

  const handleEvet = useCallback(async () => {
    if (!job || !derived || !accessToken) return;
    setApproved("yes");
    setWebhookError(null);
    setStepResult(null);
    setCanContinue(false);
    setLoading(true);
    try {
      const res = await fetch("/api/apply/howto-step", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          job_id: jobId,
          session_id: sessionId,
          step: 1,
          approved: true,
          derived: {
            source_key: derived.source_key,
            country: derived.country,
            country_code: derived.country_code,
          },
          answers: {},
        }),
      });
      const text = await res.text();
      let parsed: Record<string, unknown>;
      try {
        parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        setWebhookError("Cevap işlenemedi.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const err = parsed as { error?: string; detail?: string };
        if (res.status === 403 && err?.error === "premium_required") {
          const msg = typeof err?.detail === "string" ? err.detail : "Haftalık premium aboneliğiniz yok veya süresi dolmuş. Erişim için yeniden abone olun.";
          setWebhookError(msg);
          if (typeof window !== "undefined") window.dispatchEvent(new Event("premium-subscription-invalidate"));
        } else {
          const msg = typeof err?.detail === "string" ? err.detail.slice(0, 200) : "Rehber alınamadı. Lütfen tekrar deneyin.";
          setWebhookError(msg);
        }
        setLoading(false);
        return;
      }
      setStepResult(parsed);
      if (typeof parsed?.step === "number") setCurrentStep(parsed.step);
      setCanContinue(true);
    } catch {
      setWebhookError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [job, derived, accessToken, jobId, sessionId]);

  /** Merge formData into answers and call webhook for the given step. Used for steps 2–7. */
  const handleStepSubmit = useCallback(
    async (step: number, formData: Record<string, unknown>) => {
      if (!job || !derived || !accessToken) return;
      setWebhookError(null);
      setStepResult(null);
      setLoading(true);
      const merged = { ...answers, ...formData };
      setAnswers(merged);
      try {
        const res = await fetch("/api/apply/howto-step", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            job_id: jobId,
            session_id: sessionId,
            step,
            approved: true,
            derived: {
              source_key: derived.source_key,
              country: derived.country,
              country_code: derived.country_code,
            },
            answers: merged,
          }),
        });
        const text = await res.text();
        let parsed: Record<string, unknown>;
        try {
          parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
        } catch {
          setWebhookError("Cevap işlenemedi.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const err = parsed as { error?: string; detail?: string };
          if (res.status === 403 && err?.error === "premium_required") {
            const msg = typeof err?.detail === "string" ? err.detail : "Haftalık premium aboneliğiniz yok veya süresi dolmuş. Erişim için yeniden abone olun.";
            setWebhookError(msg);
            if (typeof window !== "undefined") window.dispatchEvent(new Event("premium-subscription-invalidate"));
          } else {
            const msg = typeof err?.detail === "string" ? err.detail.slice(0, 200) : "Rehber alınamadı. Lütfen tekrar deneyin.";
            setWebhookError(msg);
          }
          setLoading(false);
          return;
        }
        setStepResult(parsed);
        if (typeof parsed?.step === "number") setCurrentStep(parsed.step);
        setCanContinue(true);
      } catch {
        setWebhookError("Bağlantı hatası. Tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    },
    [job, derived, accessToken, jobId, sessionId, answers]
  );

  /** Advance to next step UI only (no webhook). User will submit step form to trigger webhook. */
  const handleNextStep = useCallback((_sessionIdParam: string, nextStep: number) => {
    setStepResult(null);
    setWebhookError(null);
    setStepFormData({});
    setCurrentStep(nextStep);
  }, []);

  const handleHayir = useCallback(() => {
    setApproved("no");
    setStepResult(null);
    setCanContinue(false);
  }, []);

  const handleDevam = useCallback(() => {
    setStepResult(null);
    setCanContinue(false);
    setApproved(null);
    setWebhookError(null);
    if (currentStep < 7) setCurrentStep((s) => s + 1);
  }, [currentStep]);

  const displayStep = stepResult && isGuideResponse(stepResult) ? stepResult.step : currentStep;
  const progressPercent = Math.round((displayStep / 7) * 100);

  const modalContent = !open ? null : (
    <div className="fixed inset-0 z-[9999]" role="presentation">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
      />
      <div className="relative z-[10000] flex h-full items-center justify-center p-4">
        <div
          className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl"
          role="dialog"
          aria-modal
          aria-labelledby="wizard-title"
        >
        <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
          <div className="flex items-start justify-between px-6 py-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 id="wizard-title" className="text-lg font-semibold text-gray-900">
                  Kişisel Başvuru Danışmanı
                </h2>
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                  Premium Oturum
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Bu ilan için resmi süreçler derleniyor ve sizin için yapılandırılıyor.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50"
              aria-label="Oturumu kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-6 pb-4">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span>Başvuru Stratejisi</span>
              <span>%{progressPercent}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {job && (
            <div className="px-6 pb-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {CHECKLIST_ITEMS.map((x) => (
                  <div
                    key={x}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-center text-xs text-gray-700"
                  >
                    {x}
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading && !job && (
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-600">İlan yükleniyor…</p>
            </div>
          )}

          {fetchError && !job && (
            <div className="px-6 py-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {fetchError}
              </div>
            </div>
          )}

          {job && derived && !fetchError && (
            <>
              {approved === "no" && (
                <div className="px-6 py-4">
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    Akış durduruldu. İstediğiniz zaman tekrar başlayabilirsiniz.
                  </p>
                </div>
              )}

              {approved !== "no" && (
                <>
                  {!stepResult ? (
                    <div className="px-6 py-6">
                      <p className="text-base leading-relaxed text-slate-700">{questionText}</p>

                      {currentStep === 1 ? (
                        <div className="mt-8 flex flex-wrap gap-4">
                          <button
                            type="button"
                            onClick={handleEvet}
                            disabled={loading}
                            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-medium text-white shadow-md transition hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-md"
                          >
                            {loading ? (
                              <span className="flex items-center gap-3 font-medium text-blue-100">
                                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                                <span className="text-left">
                                  <span className="block">Başvuru süreci analiz ediliyor…</span>
                                  <span className="block text-xs opacity-90">Resmi kaynaklar kontrol ediliyor…</span>
                                </span>
                              </span>
                            ) : (
                              "Stratejimi Oluştur"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleHayir}
                            disabled={loading}
                            className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                          >
                            Şimdilik Gerek Yok
                          </button>
                        </div>
                      ) : currentStep === 2 ? (
                        <div className="mt-6 space-y-4">
                          {derived?.source_key === "EURES" ? (
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => handleStepSubmit(2, { intended_stay: "kısa" })}
                                disabled={loading}
                                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Kısa süreli
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepSubmit(2, { intended_stay: "uzun" })}
                                disabled={loading}
                                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Uzun süreli
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => handleStepSubmit(2, { has_passport: true })}
                                disabled={loading}
                                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Pasaportum var
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepSubmit(2, { has_passport: false })}
                                disabled={loading}
                                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Yok
                              </button>
                            </div>
                          )}
                          {loading && (
                            <p className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                              Derleniyor…
                            </p>
                          )}
                        </div>
                      ) : (
                        <StepFormFields
                          step={currentStep}
                          stepFormData={stepFormData}
                          setStepFormData={setStepFormData}
                          onSubmit={() => handleStepSubmit(currentStep, stepFormData)}
                          loading={loading}
                        />
                      )}

                      {webhookError && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                          <p>
                            {currentStep === 6
                              ? "Rehber servisi yoğun. Lütfen «Tekrar Dene» ile aynı bilgilerle yeniden deneyin; form verileriniz korunur."
                              : webhookError}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              currentStep === 1
                                ? handleEvet()
                                : handleStepSubmit(currentStep, stepFormData)
                            }
                            className="mt-2 font-medium text-amber-800 underline hover:no-underline"
                          >
                            Tekrar Dene
                          </button>
                        </div>
                      )}
                    </div>
                  ) : isGuideResponse(stepResult) ? (
                    <>
                      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-3">
                        <main className="space-y-4 overflow-auto pr-1 lg:col-span-2">
                          {(stepResult as GuideResponse).content_blocks?.map((block, idx) => (
                            <SectionCardBlock key={idx} block={block} />
                          ))}
                          {(stepResult as GuideResponse).disclaimer_blocks &&
                            (stepResult as GuideResponse).disclaimer_blocks!.length > 0 && (
                              <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-amber-800">
                                {(stepResult as GuideResponse).disclaimer_blocks!.map((d, i) => (
                                  <p key={i} className="mt-1 first:mt-0">
                                    {d.text}
                                  </p>
                                ))}
                              </section>
                            )}
                        </main>
                        <ConsultancySummaryPanel
                          job={job}
                          derived={derived}
                          ctaUrl={(stepResult as GuideResponse).cta?.url ?? jobSourceUrl ?? null}
                        />
                      </div>
                      <footer className="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex gap-3">
                            {((stepResult as GuideResponse).cta?.url ?? jobSourceUrl) && (
                              <a
                                href={(stepResult as GuideResponse).cta?.url ?? jobSourceUrl ?? "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-medium text-white shadow-md transition hover:shadow-lg"
                              >
                                İlanı Aç
                              </a>
                            )}
                            {((stepResult as GuideResponse).ui?.next_step_ready &&
                              (stepResult as GuideResponse).ui?.next_step != null) ||
                            (typeof (stepResult as GuideResponse).step === "number" &&
                              (stepResult as GuideResponse).step < 7) ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleNextStep(
                                    (stepResult as GuideResponse).session_id,
                                    (stepResult as GuideResponse).ui?.next_step ??
                                      (stepResult as GuideResponse).step + 1
                                  )
                                }
                                disabled={nextStepLoading}
                                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-medium hover:bg-gray-50 disabled:opacity-60"
                              >
                                {nextStepLoading
                                  ? "Yükleniyor…"
                                  : (stepResult as GuideResponse).ui?.continue_label ?? "Sonraki Adım"}
                              </button>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={onClose}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Oturumu kapat
                          </button>
                        </div>
                      </footer>
                    </>
                  ) : (
                    <div className="px-6 py-6">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                        İçerik yüklenemedi.
                      </div>
                      {webhookError && <p className="mt-2 text-sm text-red-600">{webhookError}</p>}
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleDevam}
                          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                        >
                          Devam
                        </button>
                        {jobSourceUrl && (
                          <a
                            href={jobSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center rounded-xl border-2 border-brand-600 px-6 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                          >
                            İlana Git
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {(!stepResult || !isGuideResponse(stepResult)) && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-4 text-center">
            <p className="text-sm text-gray-500">Daha sonra tekrar inceleyebilirsiniz.</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
