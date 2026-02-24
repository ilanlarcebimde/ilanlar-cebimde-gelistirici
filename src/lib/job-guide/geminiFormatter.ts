/**
 * Gemini formatter: veri sabit, sadece okunabilirlik (başlık, maddeler, boşluk).
 * Düşük temp, JSON çıktı, sunucuda katı doğrulama + fallback.
 */

import { callGeminiJson, extractJsonStrict } from "@/lib/ai/gemini";
import type { FormatterOutput, JobInput } from "./formatterSchema";
import {
  validateFormatterOutput,
  buildFallbackFormat,
} from "./formatterSchema";

const SYSTEM_PROMPT = `Sen bir "metin biçimlendirici"sin. GÖREVİN: Kullanıcıya verilen VERİYİ değiştirmeden daha okunaklı hale getirmek.

KESİN KURALLAR:
- Yeni bilgi ekleme, çıkarma, varsayım yapma.
- Sayı, tarih, konum, şirket, kaynak adı, link, maaş gibi hiçbir şeyi uydurma.
- Sadece yeniden düzenle: başlıklandır, maddelendir, satırları kısalt, tekrarları kaldır.
- Veride yoksa "ilan metninde belirtilmemiş" gibi net ifade kullan.
- Çıktın SADECE JSON olacak, başka metin yok.

Çıktı formatı (birebir uygula):
{
  "ui": {
    "header": { "title": "<ilan başlığı, aynen>", "meta": ["<konum>", "<kaynak>", "<tarih>"] },
    "sections": [
      { "title": "<bölüm başlığı>", "bullets": ["<madde>", "..."], "note": "<opsiyonel not>" }
    ],
    "cta": { "label": "İlanı aç", "url": "<sadece girdideki source_url, başka link yok>" }
  },
  "strict_check": { "used_fields": ["title", "location_text", "source_name", "source_url", "snippet", "published_at"], "no_new_claims": true }
}

header.title MUTLAKA girdideki job.title ile aynı olmalı. cta.url SADECE girdideki job.source_url olabilir. Bölümlerde yeni URL yazma.`;

function buildUserPrompt(job: JobInput, answers?: Record<string, unknown>): string {
  const payload = {
    job: {
      title: job.title ?? "",
      location_text: job.location_text ?? "",
      source_name: job.source_name ?? "",
      source_url: job.source_url ?? "",
      snippet: job.snippet ?? "",
      published_at: job.published_at ?? "",
    },
    answers: answers ?? {},
  };
  return `Aşağıdaki ilan ve (varsa) kullanıcı yanıtlarını yalnızca biçimlendir. Veriyi değiştirme. Çıktı SADECE yukarıdaki JSON formatında olsun.\n\n${JSON.stringify(payload, null, 2)}`;
}

export type FormatResult =
  | { ok: true; data: FormatterOutput; source: "gemini" | "fallback" }
  | { ok: false; fallback: FormatterOutput; error: string };

export async function formatJobGuideWithGemini(
  job: JobInput,
  answers?: Record<string, unknown>
): Promise<FormatResult> {
  const fallback = buildFallbackFormat(job, answers);

  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, fallback, error: "GEMINI_API_KEY_MISSING" };
  }

  try {
    const raw = await callGeminiJson({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(job, answers),
      temperature: 0.1,
      maxOutputTokens: 2048,
      timeoutMs: 20000,
    });

    const parsed = extractJsonStrict<FormatterOutput>(raw);
    const validated = validateFormatterOutput(parsed, job);

    if (validated.ok) {
      return { ok: true, data: validated.data, source: "gemini" };
    }

    return {
      ok: false,
      fallback,
      error: validated.reason ?? "validation_failed",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return { ok: false, fallback, error: message };
  }
}
