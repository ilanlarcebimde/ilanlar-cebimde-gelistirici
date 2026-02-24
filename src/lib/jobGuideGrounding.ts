/**
 * Başvuru Paneli RAG / Grounding: canlı ve güvenilir veri.
 * - İlan sayfası (source_url) → HTML'den plain text.
 * - Vize/çalışma izni → whitelist resmî kaynaklardan fetch + cache.
 * Gemini yalnızca bu context'e dayanarak cevap verir; "araştırın" / uydurma yok.
 */

const FETCH_TIMEOUT_MS = 12_000;
const MAX_PAGE_CHARS = 18_000;
const MAX_VISA_CHARS = 8_000;
const VISA_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat

/** Resmî vize/çalışma izni kaynakları — ülke adı (normalize) → URL listesi (ilk başarılı kullanılır). */
const OFFICIAL_VISA_SOURCES: Record<string, string[]> = {
  katar: [
    "https://www.gco.gov.qa/en/visa-information/",
    "https://portal.www.gov.qa/wps/portal/explore-qatar/working-in-qatar",
  ],
  almanya: [
    "https://www.make-it-in-germany.com/en/visa-residence",
    "https://www.auswaertiges-amt.de/en/visa-service/visafragen",
  ],
  belçika: [
    "https://www.werk.belgie.be/work-permit",
  ],
  irlanda: [
    "https://www.irishimmigration.ie/coming-to-work-in-ireland/",
  ],
  hollanda: [
    "https://ind.nl/en/work/working_in_the_Netherlands",
  ],
  avusturya: [
    "https://www.migration.gv.at/en/types-of-immigration/permanent-employment/",
  ],
  polonya: [
    "https://www.gov.pl/web/uw-mazowiecki/work-permit",
  ],
  isveç: [
    "https://www.migrationsverket.se/English/Private-individuals/Working-in-Sweden.html",
  ],
  norveç: [
    "https://www.udi.no/en/want-to-apply/work-immigration/",
  ],
  finlandiya: [
    "https://migri.fi/en/work-in-finland",
  ],
  danimarka: [
    "https://www.nyidanmark.dk/en-GB/Applying/Work",
  ],
  birleşik_krallik: [
    "https://www.gov.uk/government/organisations/uk-visas-and-immigration",
  ],
  uk: [
    "https://www.gov.uk/government/organisations/uk-visas-and-immigration",
  ],
  ab: [
    "https://ec.europa.eu/immigration/work_en",
  ],
  eures: [
    "https://ec.europa.eu/eures/eures-searchengine/page/working-in-the-eu",
  ],
};

function normalizeCountryForKey(country: string): string {
  return country
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c") || "unknown";
}

/** HTML'den script/style kaldırıp düz metin çıkar (kaba ama etkili). */
function htmlToPlainText(html: string, maxChars: number): string {
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length > maxChars) cleaned = cleaned.slice(0, maxChars) + "...";
  return cleaned;
}

/**
 * URL’i fetch edip HTML’den plain text döndürür.
 * Timeout ve hata durumunda güvenli dönüş.
 */
export async function fetchUrlToPlainText(
  url: string,
  maxChars: number = MAX_PAGE_CHARS
): Promise<{ text: string; error?: string }> {
  if (!url || !url.startsWith("http")) {
    return { text: "", error: "invalid_url" };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "IlanlarCebimde-Bot/1.0 (job-guide grounding)" },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return { text: "", error: `http_${res.status}` };
    }
    const html = await res.text();
    const text = htmlToPlainText(html, maxChars);
    return { text };
  } catch (e) {
    clearTimeout(timeoutId);
    const msg = e instanceof Error ? e.message : "fetch_failed";
    return { text: "", error: msg };
  }
}

interface VisaCacheEntry {
  text: string;
  source: string;
  dateFetched: string;
  expiresAt: number;
}

const visaCache = new Map<string, VisaCacheEntry>();

/**
 * Ülkeye göre resmî vize/çalışma izni metnini getirir (whitelist + cache).
 * Cache TTL: 24 saat.
 */
export async function getVisaContextForCountry(country: string): Promise<
  | { text: string; source: string; dateFetched: string; fromCache: boolean }
  | { error: string }
> {
  const key = normalizeCountryForKey(country);
  const now = Date.now();
  const cached = visaCache.get(key);
  if (cached && cached.expiresAt > now) {
    return {
      text: cached.text,
      source: cached.source,
      dateFetched: cached.dateFetched,
      fromCache: true,
    };
  }

  const urls = OFFICIAL_VISA_SOURCES[key];
  if (!urls?.length) {
    return { error: "no_whitelist" };
  }

  for (const sourceUrl of urls) {
    const { text, error } = await fetchUrlToPlainText(sourceUrl, MAX_VISA_CHARS);
    if (error || !text || text.length < 100) continue;
    const dateFetched = new Date().toISOString().slice(0, 10);
    const entry: VisaCacheEntry = {
      text,
      source: sourceUrl,
      dateFetched,
      expiresAt: now + VISA_CACHE_TTL_MS,
    };
    visaCache.set(key, entry);
    return { text, source: sourceUrl, dateFetched, fromCache: false };
  }

  return { error: "fetch_failed_all" };
}

/** Ülke adından cache key üretir (OFFICIAL_VISA_SOURCES ile eşleşmesi için). */
export function getCountryCacheKey(country: string): string {
  return normalizeCountryForKey(country);
}

/** Whitelist’te bu ülke var mı? */
export function hasVisaWhitelist(country: string): boolean {
  const key = normalizeCountryForKey(country);
  return !!OFFICIAL_VISA_SOURCES[key]?.length;
}
