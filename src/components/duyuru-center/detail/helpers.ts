import { formatCountryLabel, formatDateTR, formatNewsTypeLabel, toTurkishBadgeText } from "../helpers";
import { DuyuruDetailData } from "./types";

export { formatDateTR };

export function getCountryLabel(countrySlug: string | null, countryMap: Map<string, string>): string {
  if (!countrySlug) return "AB Geneli";
  return countryMap.get(countrySlug) ?? formatCountryLabel(countrySlug);
}

export function getDetailBadges(post: DuyuruDetailData, countryMap: Map<string, string>): string[] {
  const badges: string[] = [];
  if (post.priority_level === "important" || post.priority_level === "critical") badges.push("Önemli");
  const rawBadge = (post.news_badge ?? "").trim().toLowerCase();
  if (rawBadge === "son-dakika" || rawBadge === "son_dakika" || rawBadge === "breaking" || rawBadge === "urgent") {
    badges.push("Son Dakika");
  }

  const typeLabel = formatNewsTypeLabel(post.news_type);
  badges.push(typeLabel);

  const country = getCountryLabel(post.country_slug, countryMap);
  if (country) badges.push(country);

  const custom = toTurkishBadgeText(post.news_badge);
  if (custom && !badges.includes(custom)) badges.push(custom);
  return badges;
}

export function buildQuickTakeaways(post: DuyuruDetailData, countryMap: Map<string, string>): string[] {
  const points: string[] = [];
  points.push(`${getCountryLabel(post.country_slug, countryMap)} için güncel resmi duyuru.`);
  if (post.news_type) points.push(`${formatNewsTypeLabel(post.news_type)} kapsamındaki değişiklikleri içerir.`);
  if (post.user_impact?.trim()) points.push(post.user_impact.trim());
  if (post.application_impact?.trim()) points.push(post.application_impact.trim());
  if (post.structured_summary?.trim()) points.push(post.structured_summary.trim());
  return points.slice(0, 5);
}

function normalizeCompareText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function headingsAreSimilar(a: string, b: string): boolean {
  const left = normalizeCompareText(a);
  const right = normalizeCompareText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftWords = new Set(left.split(" ").filter(Boolean));
  const rightWords = new Set(right.split(" ").filter(Boolean));
  if (leftWords.size === 0 || rightWords.size === 0) return false;

  let overlap = 0;
  for (const w of leftWords) {
    if (rightWords.has(w)) overlap += 1;
  }
  const ratio = overlap / Math.max(leftWords.size, rightWords.size);
  return ratio >= 0.75;
}

/**
 * İçerikteki ilk başlık hero başlığıyla aynı/çok benzerse veya H1 ise kaldırır.
 * Böylece detay sayfasında başlık tekrarı olmaz.
 */
export function cleanupDuplicateFirstHeading(html: string, pageTitle: string): string {
  const headingRegex = /<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/i;
  const match = html.match(headingRegex);
  if (!match) return html;

  const headingTag = (match[1] ?? "").toLowerCase();
  const headingInner = stripHtmlTags(match[2] ?? "");

  if (headingTag === "h1" || headingsAreSimilar(headingInner, pageTitle)) {
    return html.replace(headingRegex, "").trim();
  }
  return html;
}

/**
 * Plain text fallback: çift satır sonlarına göre paragraf blokları üretir.
 * Tek satır sonları paragraf içinde <br/> olarak korunur.
 */
export function splitPlainTextToParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}
