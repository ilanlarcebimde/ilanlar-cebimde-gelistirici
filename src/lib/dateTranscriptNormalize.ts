/**
 * Sesli asistan ve sohbet ile CV'de sesli yanıt tekrarlarını azaltmak için normalizasyon.
 * - Ardışık tek kelime tekrarı: "Ahmet Ahmet" -> "Ahmet"
 * - Ardışık iki kelimelik ifade tekrarı: "2 Nisan 2 Nisan" -> "2 Nisan"
 * - Ay adı + bitişik rakam: "Nisan2" -> "Nisan 2"
 */

const TURKISH_MONTHS =
  "Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık";

/**
 * Tüm sesli yanıt metinlerinde kelime/sayı tekrarlarını temizler (sesli asistan + sohbet CV).
 */
export function normalizeVoiceTranscript(text: string): string {
  if (!text || typeof text !== "string") return text;
  let s = text.trim();
  // Ardışık tek kelime tekrarı: "kelime kelime" -> "kelime"
  s = s.replace(/(\S+)(\s+\1)+/g, "$1");
  // Ardışık iki kelimelik ifade tekrarı
  const twoWordRepeatRegex = /(\s+(\S+)\s+(\S+))(\s+\2\s+\3)+/g;
  s = s.replace(twoWordRepeatRegex, "$1");
  // Ay adından hemen sonra gelen rakamı boşlukla ayır
  const monthDigitRegex = new RegExp(`(${TURKISH_MONTHS})(\\d)`, "gi");
  s = s.replace(monthDigitRegex, (_, month, digit) => `${month} ${digit}`);
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Tarih alanı için (normalizeVoiceTranscript ile aynı; uyumluluk için bırakıldı).
 */
export function normalizeDateTranscript(text: string): string {
  return normalizeVoiceTranscript(text);
}
