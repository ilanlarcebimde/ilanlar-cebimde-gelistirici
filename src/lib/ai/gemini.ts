/**
 * Gemini API: JSON garanti + retry/parse guard.
 * Başvuru Paneli: system + user prompt birleştirilir; çıktı strict JSON.
 */

export async function callGeminiJson(opts: {
  system: string;
  user: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
  const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash")
    .trim()
    .replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${opts.system}\n\n---\n\n${opts.user}` }],
        },
      ],
      generationConfig: {
        temperature: opts.temperature ?? 0.2,
        topP: 0.9,
        maxOutputTokens: opts.maxOutputTokens ?? 1400,
      },
    }),
  }).finally(() => clearTimeout(t));

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GEMINI_HTTP_${res.status}:${txt.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const rawText =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text)
      .filter(Boolean)
      .join("") ?? "";

  if (!rawText.trim()) throw new Error("GEMINI_EMPTY_RESPONSE");
  return rawText;
}

export function extractJsonStrict<T = Record<string, unknown>>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("JSON_PARSE_FAILED");
  }
}

/** "Araştırın" vb. yasak ifadeleri tespit edip mesajdan çıkarır veya uyarı döner. */
export function redactForbiddenPhrases(text: string): {
  cleaned: string;
  hadForbidden: boolean;
} {
  const forbidden = [
    /\baraştırın\b/gi,
    /\baraştır\b/gi,
    /\bgoogle\s*(layın|'da\s*arat)/gi,
    /\bkaynaklara\s*bakın\b/gi,
  ];
  let cleaned = text;
  let hadForbidden = false;
  for (const re of forbidden) {
    if (re.test(cleaned)) {
      hadForbidden = true;
      cleaned = cleaned.replace(re, "[kullanma: sadece verilen context]");
    }
  }
  return { cleaned, hadForbidden };
}
