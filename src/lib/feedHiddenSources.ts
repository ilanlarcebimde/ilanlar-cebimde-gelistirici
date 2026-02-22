/**
 * Kartta kaynak adı gösterilmeyecek kaynaklar (ilanlar listede kalır, sadece isim gizlenir).
 * Yeni eklemek için bu listeye küçük harf anahtar ekleyin.
 */
const HIDDEN_SOURCE_KEYS = ["glassdoor", "eures"] as const;

/** Kaynak adı kartta gösterilmesin mi (sadece görüntüleme; ilan filtrelenmez). */
export function isHiddenSourceName(sourceName: string | null): boolean {
  if (!sourceName?.trim()) return false;
  const lower = sourceName.trim().toLowerCase();
  return HIDDEN_SOURCE_KEYS.some((key) => lower.includes(key));
}
