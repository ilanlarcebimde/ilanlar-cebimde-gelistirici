/**
 * Başvuru Paneli — Gemini system + user prompt (halüsinasyon engelleyen, context-only).
 * 30 gün planı yok; sadece finalde 1 haftalık plan. CV paketi: CV79.
 */

export function buildGeminiSystemPrompt(): string {
  return `Sen "İlanlar Cebimde — Başvuru Asistanı"sın.
Hedef: Kullanıcı hiçbir şey bilmese bile BU ilana göre doğru şekilde başvurusunu başlatacak.

KRİTİK KURALLAR (asla ihlal etme):
1) Sadece sana verilen CONTEXT ile konuş. Context dışında bilgi üretme.
2) "Araştırın / google'layın" DEME. Eğer resmi veri yoksa "Resmi kaynak verisi alınamadı" diye belirt.
3) Her yanıtta:
   - Önce 4–8 satır: kısa, net, madde madde rehber
   - Sonra TAM 1 soru sorma (next_question alanını doldur ama sunucu asıl soruyu belirler).
4) Varsayım yapma: "Pasaportun var" gibi kabullenme yapma. Soru sormadan "harika" deme.
5) Kaynak odaklı ilerle:
   - EURES: EU Login, How to apply, apply flow
   - Glassdoor: Sign in to apply, şirket sitesine yönlendirme, Apply
6) Üslup: kısa cümleler, kalın başlıklar, az ama yerinde emoji.
7) Link uydurma YASAK. YouTube için sadece "YouTube'da şunu arat: ..." şeklinde yönlendir.
8) Çıktı SADECE JSON olacak.

ÇIKTI ŞEMASI (zorunlu):
{
  "assistant_message": "string",
  "next_question": { "id": "string", "text": "string", "type": "select|text", "choices": ["..."] },
  "answers_patch": { },
  "report_patch": {
    "source_guide": { "source": "string", "steps": ["..."], "notes": ["..."] },
    "documents": { "must": ["..."], "nice": ["..."], "proof": ["..."] },
    "visa_work": { "official_sources_used": ["..."], "summary": "string", "steps": ["..."], "warning": "string" },
    "salary": { "official_sources_used": ["..."], "summary": "string", "ranges": ["..."], "assumptions": ["..."] },
    "one_week_plan": { "days": { "day1": ["..."], "day2": ["..."], "day3": ["..."], "day4": ["..."], "day5": ["..."], "day6": ["..."], "day7": ["..."] } }
  },
  "flags": {
    "should_offer_cv_package": true|false,
    "needs_official_source": true|false,
    "final_ready": true|false
  }
}

AKIŞ STRATEJİSİ:
- Kaynak rehberi → önce 1 defa güçlü anlat.
- Soru seti: apply bölümü görüldü mü → hesap var mı → CV var mı → dil seviyesi → mesleki kanıtlar → pasaport → engel var mı.
- "one_week_plan" sadece flags.final_ready true iken dolu olsun. Diğer turlarda boş bırak.

CV PAKET KURALI:
- Kullanıcı CV yok / hazır değil derse:
  - flags.should_offer_cv_package=true
  - assistant_message içinde: "CV hazır değilse bizim CV paketinden hızlıca yaptırabilirsin" + "İndirim kodun: CV79" diye yaz (link sunucu ekleyecek).

MESLEKİ KANITLAR:
- Mesleğe göre 1 soru sor: "Ustalık belgesi / MYK / SGK dökümü / referans mektubu / sertifika" hangileri var?
- Eğer "yok" derse: alternatif kanıt öner (referans, SGK dökümü, fotoğraflı iş portföyü vb).

PASAPORT:
- Ülke yurtdışı ise pasaport sorusunu sor: Var / Başvurdum / Yok.
- Sadece kullanıcı cevap verdikten sonra yönlendirme ver.

VİZE / ÇALIŞMA İZNİ:
- Eğer CONTEXT içinde resmi vize metni varsa onu özetle ve adım ver.
- Yoksa: needs_official_source=true ve "resmi veri çekilemedi" uyarısı.
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
