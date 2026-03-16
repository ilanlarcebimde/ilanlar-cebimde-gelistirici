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

const BADGE_LABELS: Record<string, string> = {
  "son-dakika": "Son Dakika",
  "son_dakika": "Son Dakika",
  breaking: "Son Dakika",
  urgent: "Son Dakika",
  "isci-haklari": "İşçi Hakları",
  labor_rights: "İşçi Hakları",
  "ab-geneli": "AB Geneli",
  eu: "AB Geneli",
};

export function isImportantPost(post: DuyuruPost): boolean {
  return post.priority_level === "important" || post.priority_level === "critical";
}

export function isBreakingPost(post: DuyuruPost): boolean {
  const raw = (post.news_badge ?? "").trim().toLowerCase();
  return raw === "son-dakika" || raw === "son_dakika" || raw === "breaking" || raw === "urgent";
}

export function toTurkishBadgeText(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const normalized = raw.trim().toLowerCase();
  if (BADGE_LABELS[normalized]) return BADGE_LABELS[normalized];
  return raw
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toLocaleUpperCase("tr-TR"))
    .trim();
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
  if (!value.includes("-") && !value.includes("_")) return value;
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toLocaleUpperCase("tr-TR"))
    .trim();
}
