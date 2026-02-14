/**
 * response.json() çağırmadan önce Content-Type ve res.ok kontrolü.
 * Backend HTML döndürürse (404/500/redirect) JSON parse hatası yerine
 * anlaşılır hata mesajı döner; teknik detay sadece console'da.
 */
const JSON_CONTENT_TYPE = "application/json";

export async function safeParseJsonResponse<T = unknown>(
  res: Response,
  options?: { logPrefix?: string }
): Promise<T> {
  const prefix = options?.logPrefix ?? "[fetch]";
  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text();

  const logNonJson = (label: string) => {
    if (text.length > 0) {
      const preview = text.slice(0, 300);
      console.warn(
        `${prefix} ${label}: url=${res.url} status=${res.status} content-type=${ct} body=${preview}${text.length > 300 ? "…" : ""}`
      );
    }
  };

  if (!res.ok) {
    logNonJson("error response");
    let parsed: { error?: string } = {};
    if (ct.toLowerCase().includes(JSON_CONTENT_TYPE)) {
      try {
        parsed = JSON.parse(text) as { error?: string };
      } catch {
        // body JSON değilse parsed boş kalır
      }
    }
    const message = parsed?.error ?? "İşlem başarısız. Lütfen tekrar deneyin.";
    throw new Error(message);
  }

  if (!ct.toLowerCase().includes(JSON_CONTENT_TYPE)) {
    logNonJson("non-JSON response");
    throw new Error("Sayfa yüklenemedi. Lütfen tekrar deneyin.");
  }

  try {
    if (!text.trim()) return {} as T;
    return JSON.parse(text) as T;
  } catch (e) {
    console.warn(`${prefix} JSON parse error:`, e);
    throw new Error("Sayfa yüklenemedi. Lütfen tekrar deneyin.");
  }
}
