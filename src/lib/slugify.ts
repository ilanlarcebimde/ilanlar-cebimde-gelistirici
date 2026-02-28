/**
 * Tek slug üretim kaynağı — Türkçe karakterler, apostrof ve özel karakterler güvenli ASCII slug'a dönüştürülür.
 * Tüm slug üretimi (admin form, API, slug-check) bu fonksiyonu kullanmalı.
 *
 * Test case'ler (beklenen çıktı):
 * 1) "Belçika Gent'te Ahşap Ustası Alımı – Tam Zamanlı İş Fırsatı" => "belcika-gent-te-ahsap-ustasi-alimi-tam-zamanli-is-firsati"
 * 2) "İsveç / Svedala | HVAC İş İlanı 2026" => "isvec-svedala-hvac-is-ilani-2026"
 * 3) "Çalışma Şartı: 40 Saat / Ücret 2.500€" => "calisma-sarti-40-saat-ucret-2500"
 */

const TR_MAP: Record<string, string> = {
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ş: "s",
  Ş: "s",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
};

const APOSTROPHE_CHARS = /[''`´]/g;
const AMPERSAND = /&/g;
/** Rakamlar arası nokta (binlik ayracı) kaldır: 2.500 → 2500 */
const THOUSAND_DOT = /(?<=\d)\.(?=\d)/g;
const NON_ALPHANUMERIC = /[^a-z0-9\s-]/g;
const MULTI_SPACE_OR_DASH = /[\s-]+/g;

/**
 * Türkçe metni SEO dostu, ASCII-safe slug'a çevirir.
 * - ğ,ü,ş,ı,ö,ç → g,u,s,i,o,c
 * - Apostrof varyantları kaldırılır
 * - & → "ve"
 * - Boşluk/altçizgi → "-"
 * - Ardışık tire tek tire, baş/son kırpılır
 * - Maks 80 karakter; boş dönerse "icerik"
 */
export function slugifyTR(input: string, maxLen = 80): string {
  if (typeof input !== "string") return "icerik";
  let s = input.trim();
  if (!s) return "icerik";

  // Türkçe harf map (önce büyük İ ve ı özel)
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (TR_MAP[c] !== undefined) {
      out += TR_MAP[c];
    } else {
      out += c;
    }
  }
  s = out;

  // Apostrof varyantları kaldır
  s = s.replace(APOSTROPHE_CHARS, "");
  // & → ve
  s = s.replace(AMPERSAND, " ve ");
  // Küçük harfe çevir (TR map sonrası ASCII'ye yakın)
  s = s.toLowerCase();
  // Binlik noktası kaldır (2.500 → 2500)
  s = s.replace(THOUSAND_DOT, "");
  // Emoji/diacritics ve özel karakterler: sadece a-z, 0-9, boşluk, tire kalsın
  s = s.replace(NON_ALPHANUMERIC, " ");
  // Boşluk ve tireleri tek tireye indir
  s = s.replace(MULTI_SPACE_OR_DASH, "-");
  // Baştaki/sondaki tireleri kırp
  s = s.replace(/^-+|-+$/g, "");
  if (!s) return "icerik";
  if (s.length > maxLen) s = s.slice(0, maxLen).replace(/-+$/, "");
  return s || "icerik";
}

/**
 * Slug'ı insan okunur etiket metnine çevirir (ülke/sektör adı yoksa kullanılır).
 * Örn: "mekanik-tesisat" → "Mekanik Tesisat"
 */
export function humanizeSlug(slug: string | null | undefined): string {
  if (!slug?.trim()) return "";
  return slug
    .trim()
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
