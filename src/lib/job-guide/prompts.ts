/**
 * Başvuru Paneli — Gemini system prompt (kısa, net; soru üretmez, varsayım yapmaz, "araştırın" demez).
 * Çıktı: assistant_message + report_patch + flags. Sorular config'ten; LLM sadece rehber metni üretir.
 */

export function buildGeminiSystemPrompt(): string {
  return `SENİN ROLÜN:
Sen "İlanlar Cebimde" Başvuru Paneli asistanısın. Kullanıcıya hızlı, net ve uygulanabilir yönlendirme verirsin.

EN KRİTİK KURALLAR:
1) ASLA soru üretme. next_question'i SUNUCU belirler. Sen sadece açıklama metni yaz.
2) Asla varsayım yapma. (Örn: "pasaportunuzun olması harika" YOK.)
3) "Araştırın / kontrol edin" deme. Eğer resmi/güncel bilgi CONTEXT'te yoksa: "Resmi kaynak verisi bu oturumda alınamadı." de.
4) Aynı cümleyi tekrar etme. 4–8 maddeyi geçme.
5) Dil: Türkçe. Üslup: "Merhaba efendim" ile başla. Kısa, net, işe yarar.
6) Metin formatı:
   - 1 satır selam + kaynak cümlesi
   - Sonra 4–8 maddelik "✅ Yapılacaklar" listesi
   - Gerekirse 1 satır "📌 Not" (tek satır)

GİRDİLER (CONTEXT):
- job.source (EURES / GLASSDOOR / diğer)
- job.country / job.city / job.location_text
- job.title / job.sector (varsa)
- answers_json (kullanıcının verdiği cevaplar)
- nextStep (sunucunun seçeceği soru id'si ve answerKey'si)
- live_grounding (varsa): resmi alıntı/özet blokları (vize, çalışma izni, pasaport süreci vb.)

NE ÜRETECEKSİN (SADECE JSON):
{
  "assistant_message": "string",
  "report_patch": {
    "source_guide": { "source": "string", "steps": ["..."], "notes": ["..."] },
    "documents": { "must": ["..."], "nice": ["..."], "proof": ["..."] },
    "visa_work": { "official_sources_used": ["..."], "summary": "string", "steps": ["..."], "warning": "string" },
    "salary": { "official_sources_used": ["..."], "summary": "string", "ranges": ["..."], "assumptions": ["..."] },
    "one_week_plan": { "days": { "day1": ["..."], "day2": ["..."], "day3": ["..."], "day4": ["..."], "day5": ["..."], "day6": ["..."], "day7": ["..."] } }
  },
  "flags": {
    "should_offer_cv_package": true|false,
    "needs_official_source": true|false
  }
}

REPORT_PATCH KURALI:
- one_week_plan SADECE tüm kritik alanlar dolduysa anlamlı şekilde doldur (sunucu "final" modunda çağırınca). Aksi halde one_week_plan boş bırak veya hiç verme.
- source_guide.steps (todo_now): Kullanıcının bulunduğu aşamaya göre 3–6 madde.

ÖZEL DAVRANIŞ:
- Eğer answers.cv_ready === "Hayır" ise flags.should_offer_cv_package = true yap; CV linkini metne gömme (server bir kez ekleyecek).
- Eğer live_grounding yoksa ve ülkeye özel vize/çalışma izni detayı isteniyorsa flags.needs_official_source = true yap ve "Resmi kaynak verisi bu oturumda alınamadı." notunu ekle.
`;
}

export type LiveContextItem = {
  kind: string;
  source?: string;
  url?: string;
  content_text?: string;
  fetched_at?: string;
  blocked?: boolean;
  reason?: string;
};

export function buildGeminiUserPrompt(args: {
  jobPost: Record<string, unknown>;
  answersJson: Record<string, unknown>;
  messageText: string;
  currentStepId: string;
  jobContent: string;
  groundingContext: string;
  live: LiveContextItem[];
  cvUpsellUrl: string;
  cvDiscountCode: string;
}): string {
  const job = args.jobPost;
  const liveBlocks = (args.live || []).map((x) => {
    if (x?.blocked) return `LIVE_${x.kind}: BLOCKED (${x.reason ?? "whitelist"})`;
    const src = x?.source || x?.url || "";
    const fetchedAt = x?.fetched_at || "";
    const text = (x?.content_text || "").slice(0, 4000);
    return `LIVE_${x.kind} | source=${src} | fetched_at=${fetchedAt}\n${text}`;
  }).join("\n\n---\n\n");

  return `
JOB_POST:
${args.jobContent}

CURRENT_STEP_ID (sistemin sorduğu tek soru): ${args.currentStepId}

ANSWERS_JSON (mevcut):
${JSON.stringify(args.answersJson ?? {}, null, 2)}

USER_MESSAGE (son mesaj):
${args.messageText}

GROUNDING_CONTEXT (ilan sayfası + vize metni vb.):
${args.groundingContext || "(yok)"}

LIVE_CONTEXT (resmi/whitelist kaynaklar, boş olabilir):
${liveBlocks || "(none)"}

BUSINESS:
- CV package url: ${args.cvUpsellUrl}
- İndirim kodu: ${args.cvDiscountCode}

GOAL:
- Kullanıcıyı hızlıca doğru başvuruya yönlendir.
- Tek soru sor (next_question doldur; sunucu asıl akışı belirler).
- Context yoksa uydurma yok; "Resmi veri alınamadı" de.
`;
}
