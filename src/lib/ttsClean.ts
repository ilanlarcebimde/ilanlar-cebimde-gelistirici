/**
 * TTS'e gönderilmeden önce metni doğal okunacak hale getirir.
 * Parantez içleri okunmaz; +90 → "artı 90"; tarih ve sayılar doğal ifade.
 */

/** Parantez ve köşeli parantez içlerini kaldırır (sadece ekranda kalır, seslendirilmez). */
export function stripParentheticals(text: string): string {
  return text
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** +90 veya +90 5xx... → "artı 90" / "artı 90 5..." şeklinde okunur. */
export function phoneForSpeech(text: string): string {
  let out = text.trim();
  if (/^\+\s*90\b/i.test(out) || out.startsWith("+90")) {
    out = out.replace(/^\+\s*90\s*/i, "artı 90 ").replace(/^\+\s*90/i, "artı 90");
  } else if (out.startsWith("+")) {
    out = "artı " + out.slice(1).trim();
  }
  return out.replace(/\s+/g, " ").trim();
}

/** 15.03.1985 veya 15-03-1985 → "15 Mart 1985" (TTS daha doğal okur). */
export function dateForSpeech(text: string): string {
  const trimmed = text.trim();
  const d = trimmed.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})$/);
  if (!d) return trimmed;
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  const day = d[1].replace(/^0/, "");
  const month = months[parseInt(d[2], 10) - 1] || d[2];
  const year = d[3].length === 2 ? "19" + d[3] : d[3];
  return `${day} ${month} ${year}`;
}

/** "5+" → "5 yıldan fazla" vb. */
export function yearsForSpeech(text: string): string {
  const t = text.trim();
  const m = t.match(/^(\d+)\s*\+\s*$/);
  if (m) return `${m[1]} yıldan fazla`;
  return t;
}

/**
 * speakText için: parantez temizle, telefon/tarih/yıl kalıplarını doğal ifadeye çevir.
 * answerKey ile hangi alan için olduğu verilirse daha doğru dönüşüm yapılabilir.
 */
export function cleanTextForTTS(
  text: string,
  options?: { answerKey?: string }
): string {
  if (!text?.trim()) return text;
  let out = stripParentheticals(text);

  const key = (options?.answerKey ?? "").toLowerCase();
  if (key.includes("phone") || key.includes("telefon")) {
    out = phoneForSpeech(out);
  } else if (key.includes("birth") || key.includes("date") || key.includes("tarih")) {
    out = dateForSpeech(out);
  } else if (key.includes("year") || key.includes("experience") || key.includes("yil")) {
    out = yearsForSpeech(out);
  }

  return out.replace(/\s+/g, " ").trim();
}
