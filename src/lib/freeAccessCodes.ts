/** İş başvuru mektubu kilit sayfası slug’ı (target_slug) */
export const LETTER_PANEL_TARGET_SLUG = "is-basvuru-mektubu-olustur";

/** Admin ve doğrulama tarafında tek tip saklama: trim + boşluk sadeleştirme + büyük harf */
export function normalizeAccessCode(input: string): string {
  return input.trim().replace(/\s+/g, " ").toUpperCase();
}
