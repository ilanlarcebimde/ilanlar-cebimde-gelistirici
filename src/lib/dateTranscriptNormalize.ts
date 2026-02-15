/**
 * Sesli asistan tarih cevaplarında STT tekrarlarını azaltmak için normalizasyon.
 * - Ay adı + bitişik rakam: "Nisan2" -> "Nisan 2"
 * - Ardışık tekrar eden iki kelimelik ifade: "2 Nisan 2 Nisan 2 Nisan" -> "2 Nisan"
 */

const TURKISH_MONTHS =
  "Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık";

/**
 * Tarih benzeri sesli cevap metnindeki tekrarları ve bitişik yazımları düzeltir.
 */
export function normalizeDateTranscript(text: string): string {
  if (!text || typeof text !== "string") return text;
  let s = text.trim();
  // Ay adından hemen sonra gelen rakamı boşlukla ayır: Nisan2 -> Nisan 2
  const monthDigitRegex = new RegExp(
    `(${TURKISH_MONTHS})(\\d)`,
    "gi"
  );
  s = s.replace(monthDigitRegex, (_, month, digit) => `${month} ${digit}`);
  // Ardışık tekrar eden "kelime1 kelime2" ifadesini tekilleştir
  const twoWordRepeatRegex = /(\s+(\S+)\s+(\S+))(\s+\2\s+\3)+/g;
  s = s.replace(twoWordRepeatRegex, "$1");
  return s.replace(/\s+/g, " ").trim();
}
