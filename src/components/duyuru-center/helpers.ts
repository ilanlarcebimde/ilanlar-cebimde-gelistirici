import { DuyuruPost } from "./types";

export const NEWS_TYPE_LABELS: Record<string, string> = {
  visa: "Vize",
  passport: "Pasaport",
  work_permit: "Çalışma İzni",
  international_employment: "Yurtdışı İstihdam",
  official_announcement: "Resmi Duyuru",
  country_update: "Ülke Güncellemesi",
  consular_services: "Konsolosluk",
  migration_procedure: "Göç / Çalışma Prosedürü",
};

function titleCaseTR(input: string): string {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (!word) return "";
      // Kısa ve tamamen büyük kısaltmaları koru (AB, ABD vb.).
      if (word === word.toLocaleUpperCase("tr-TR") && word.length <= 4) return word;
      const lower = word.toLocaleLowerCase("tr-TR");
      const [first, ...rest] = Array.from(lower);
      if (!first) return "";
      return first.toLocaleUpperCase("tr-TR") + rest.join("");
    })
    .join(" ");
}

export function normalizeNewsType(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  return raw.trim().toLocaleLowerCase("tr-TR");
}

export function formatNewsTypeLabel(raw: string | null | undefined): string {
  const normalized = normalizeNewsType(raw);
  if (!normalized) return "Resmi Duyuru";
  const mapped = NEWS_TYPE_LABELS[normalized];
  if (mapped) return mapped;
  return titleCaseTR(normalized);
}

export function isImportantPost(post: DuyuruPost): boolean {
  return post.priority_level === "important" || post.priority_level === "critical";
}

export function isBreakingPost(post: DuyuruPost): boolean {
  const raw = (post.news_badge ?? "").trim().toLowerCase();
  return raw === "son-dakika" || raw === "son_dakika" || raw === "breaking" || raw === "urgent";
}

export function toTurkishBadgeText(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  return titleCaseTR(raw);
}

export function formatDateTR(isoLike: string | null): string {
  if (!isoLike) return "Tarih belirtilmedi";
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return "Tarih belirtilmedi";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatCountryLabel(raw: string | null | undefined): string {
  if (!raw?.trim()) return "AB Geneli";
  const value = raw.trim();
  // Editörde serbest metin olarak girilen ülke adlarını (örn: "Kıbrıs (KKTC)") birebir koru.
  // Sadece slug benzeri değerleri insan okunur hale getir.
  if (/^[a-z0-9_-]+$/.test(value)) {
    return titleCaseTR(value);
  }
  return value;
}
