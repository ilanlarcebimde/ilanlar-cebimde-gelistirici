export type NormalizeResult = {
  value: unknown;
  changed: boolean;
  warning?: string;
};

function changedIfDifferent(a: unknown, b: unknown) {
  return String(a ?? "") !== String(b ?? "");
}

function trimSpaces(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

/** +90 5xx xxx xx xx → +905xxxxxxxxx (TR ağırlıklı) */
export function normalizePhone(raw: unknown): NormalizeResult {
  const input = trimSpaces(String(raw ?? ""));
  if (!input) return { value: "", changed: false };

  let cleaned = input.replace(/[^\d+]/g, "");
  cleaned = cleaned.replace(/\+(?=.)/g, (_, offset) => (offset === 0 ? "+" : ""));

  if (/^0\d{10}$/.test(cleaned)) {
    cleaned = "+90" + cleaned.slice(1);
  }
  if (/^90\d{10}$/.test(cleaned)) cleaned = "+" + cleaned;

  const justDigits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  if (justDigits.length < 8 || justDigits.length > 15) {
    return {
      value: cleaned,
      changed: changedIfDifferent(input, cleaned),
      warning: "Telefon numarası uzunluğu alışılmadık görünüyor.",
    };
  }

  return { value: cleaned, changed: changedIfDifferent(input, cleaned) };
}

export function normalizeEmail(raw: unknown): NormalizeResult {
  const input = String(raw ?? "");
  const cleaned = input.trim().toLowerCase();
  if (!cleaned) return { value: "", changed: false };

  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
  if (!ok) {
    return {
      value: cleaned,
      changed: changedIfDifferent(input, cleaned),
      warning: "E-posta formatı hatalı görünüyor.",
    };
  }
  return { value: cleaned, changed: changedIfDifferent(input, cleaned) };
}

/** "2 sene", "3 yıl", "18 ay" → sayı (yıl cinsinden) */
export function normalizeYears(raw: unknown): NormalizeResult {
  const input = trimSpaces(String(raw ?? ""));
  if (!input) return { value: "", changed: false };

  const direct = Number(input.replace(",", "."));
  if (Number.isFinite(direct)) {
    const v = Math.max(0, direct);
    return { value: v, changed: changedIfDifferent(input, v) };
  }

  const m = input.toLowerCase();

  const ay = m.match(/(\d+(?:[.,]\d+)?)\s*(ay)/);
  if (ay) {
    const n = Number(ay[1].replace(",", "."));
    const years = Math.max(0, n / 12);
    const rounded = Math.round(years * 10) / 10;
    return { value: rounded, changed: true };
  }

  const yil = m.match(/(\d+(?:[.,]\d+)?)\s*(yıl|yil|sene)/);
  if (yil) {
    const n = Number(yil[1].replace(",", "."));
    const v = Math.max(0, n);
    return { value: v, changed: true };
  }

  return {
    value: input,
    changed: false,
    warning: "Süreyi sayı olarak yazmak daha iyi olur (örn: 2).",
  };
}

/** Tarihi mümkünse YYYY-AA-GG formatına çeker. */
export function normalizeDate(raw: unknown): NormalizeResult {
  const input = trimSpaces(String(raw ?? ""));
  if (!input) return { value: "", changed: false };

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return { value: input, changed: false };

  let m = input.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3];
    return { value: `${yyyy}-${mm}-${dd}`, changed: true };
  }

  m = input.match(/^(\d{1,2})[./-](\d{4})$/);
  if (m) {
    const mm = m[1].padStart(2, "0");
    const yyyy = m[2];
    return {
      value: `${yyyy}-${mm}-01`,
      changed: true,
      warning: "Gün belirtilmediği için 01 varsayıldı.",
    };
  }

  if (/^\d{4}$/.test(input)) {
    return {
      value: `${input}-01-01`,
      changed: true,
      warning: "Ay/gün belirtilmediği için 01-01 varsayıldı.",
    };
  }

  return {
    value: input,
    changed: false,
    warning: "Tarih formatı belirsiz. Örn: 2024-06-15 yazabilirsin.",
  };
}

export function normalizeUrl(raw: unknown): NormalizeResult {
  const input = trimSpaces(String(raw ?? ""));
  if (!input) return { value: "", changed: false };

  let out = input;
  if (!/^https?:\/\//i.test(out)) {
    out = "https://" + out;
  }
  const ok = /^https?:\/\/\S+\.\S+/.test(out);
  if (!ok) {
    return {
      value: out,
      changed: changedIfDifferent(input, out),
      warning: "Bağlantı formatı hatalı görünüyor.",
    };
  }
  return { value: out, changed: changedIfDifferent(input, out) };
}

export function normalizeText(raw: unknown): NormalizeResult {
  const input = String(raw ?? "");
  const out = trimSpaces(input);
  return { value: out, changed: changedIfDifferent(input, out) };
}

export function normalizeBySemantic(kind: string | undefined, rawValue: unknown): NormalizeResult {
  switch (kind) {
    case "phone":
      return normalizePhone(rawValue);
    case "email":
      return normalizeEmail(rawValue);
    case "years":
      return normalizeYears(rawValue);
    case "date":
      return normalizeDate(rawValue);
    case "url":
      return normalizeUrl(rawValue);
    case "city":
    case "country":
    case "company":
    case "roleTitle":
    case "fullName":
    case "freeText":
    default:
      return normalizeText(rawValue);
  }
}
