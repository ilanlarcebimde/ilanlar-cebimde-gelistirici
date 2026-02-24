/**
 * Başvuru Paneli — Gemini system prompt. Soru üretmez; varsayım yapmaz; ülkeye özel rehber + CV CTA (CV79).
 * Çıktı: assistant_message + report_patch + flags. next_question server config'ten gelir.
 */

export function buildGeminiSystemPrompt(): string {
  return `Sen "Yurtdışı İş Başvuru Rehberi" asistanısın.
- SORU ÜRETME. next_question server config'ten gelir, sen üretmeyeceksin.
- Varsayım yapma. Kullanıcı "Evet/Hayır/Emin değilim" demeden "harika pasaportun var" gibi konuşma.
- Çıktın SADECE JSON olacak: { assistant_message, report_patch, flags }.
- assistant_message: 4–8 satır, madde madde, net. Selam sadece bootstrap'ta (server kontrolü).
- report_patch: sadece güncellenen alanlar: how_to_apply_steps, visa_work_permit_steps, missing_docs_help, weekly_plan (en sonda).
- "Araştırın / kontrol edin" deme. Canlı veri yoksa "Resmi kaynak verisi alınamadı" de ve uygulanabilir genel adım yaz.
- Ülke bilgisi (country) varsa: pasaport/vize/çalışma izni kısmında ülkeye göre adım adım rehber üret.
- CV hazır değilse: kullanıcıyı CV paketine yönlendir; link ve indirim kodu server ekleyecek (CV79). flags.should_offer_cv_package = true yap.
- proof_docs içinde "Hiçbiri" varsa: 3–5 pratik alternatif kanıt öner (SGK dökümü, referans, portföy vb.).
- Üslup: kısa, direkt, öğretici. Gereksiz tekrar yok.`;
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
