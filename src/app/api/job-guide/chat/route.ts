import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForUser, getSupabaseAdmin } from "@/lib/supabase/server";
import {
  buildChecklist,
  calcProgress,
  getMissingTop,
  answersFromJson,
} from "@/lib/checklistRules";

export const runtime = "nodejs";
export const maxDuration = 60;

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseForUser(token);
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { user, supabase } : null;
}

function inferCountry(channelSlug: string | null, locationText: string): string {
  const slug = (channelSlug ?? "").toLowerCase();
  const loc = locationText.toLowerCase();
  const bySlug: Record<string, string> = {
    katar: "Katar", belcika: "Belçika", irlanda: "İrlanda", almanya: "Almanya",
    hollanda: "Hollanda", avusturya: "Avusturya", polonya: "Polonya",
    isvec: "İsveç", norvec: "Norveç", finlandiya: "Finlandiya", danimarka: "Danimarka",
  };
  if (slug && bySlug[slug]) return bySlug[slug];
  if (/\b(katar|qatar)\b/.test(loc)) return "Katar";
  if (/\b(belçika|belgium|belcika)\b/.test(loc)) return "Belçika";
  if (/\b(irlanda|ireland)\b/.test(loc)) return "İrlanda";
  if (/\b(almanya|germany|deutschland)\b/.test(loc)) return "Almanya";
  if (/\b(hollanda|netherlands)\b/.test(loc)) return "Hollanda";
  if (/\b(avusturya|austria)\b/.test(loc)) return "Avusturya";
  if (/\b(polonya|poland)\b/.test(loc)) return "Polonya";
  return channelSlug ? channelSlug : loc || "unknown";
}

/** Serbest metin cevabı answers_json patch'ine çevirir. last_ask_id ile "Var"/"Yok" doğru alana yazılır. */
function normalizeUserMessageToAnswers(text: string, lastAskId?: string): Record<string, unknown> {
  const t = text.toLowerCase().trim();
  const patch: Record<string, unknown> = {};
  if (/\b(pasaportum\s*yok|pasaport\s*yok|yok)\b/.test(t)) patch.passport = "yok";
  else if (/\b(pasaportum\s*var|pasaport\s*var|var)\b/.test(t)) patch.passport = "var";
  else if (/\b(başvurdum|basvurdum)\b/.test(t)) patch.passport = "basvurdum";
  if (/\b(cv\s*yok|cv'm\s*yok|cv hazır değil)\b/.test(t)) { patch.cv = "yok"; patch.cv_uploaded = "yok"; }
  else if (/\b(cv\s*var|cv'm\s*var|cv hazır|hazır|cv yükledim)\b/.test(t)) { patch.cv = "var"; patch.cv_uploaded = "var"; }
  if (/\b(eu\s*login|eures)\s*(hesabım\s*var|var|giriş yaptım)\b/.test(t) || /eures.*var|var.*eures/.test(t)) patch.has_eu_login = "var";
  else if (/\b(eu\s*login|eures)\s*(yok|hesabım yok)\b/.test(t) || /eures.*yok/.test(t)) patch.has_eu_login = "yok";
  if (/\b(glassdoor)\s*(hesabım\s*var|var)\b/.test(t) || /glassdoor.*var|var.*glassdoor/.test(t)) patch.has_glassdoor_account = "var";
  else if (/\b(glassdoor)\s*(yok|hesabım yok)\b/.test(t)) patch.has_glassdoor_account = "yok";
  if (/\b(başvuru\s*bölümünü\s*açtım|how to apply|açtım)\b/.test(t) || /ilan\s*sayfasına\s*geldim/.test(t)) patch.source_apply_opened = "var";
  if (/\b(apply\s*adımına\s*geldim|başvuru\s*akışını\s*başlattım|ekranını\s*gördüm)\b/.test(t)) patch.source_apply_started = "var";
  if (/\b(başvuruyu\s*tamamladım|tamamladım|kanalı\s*not\s*aldım)\b/.test(t)) patch.source_apply_done = "var";
  if (/\b(profil\s*tam|profilim\s*tam|bilgilerim\s*tam)\b/.test(t)) patch.profile_complete = "var";
  if (/^(var|yok|evet|hayır|emin değilim)$/.test(t) && lastAskId) {
    const val = t === "evet" || t === "var" ? "var" : t === "hayır" || t === "yok" ? "yok" : undefined;
    if (val && lastAskId === "has_eu_login") patch.has_eu_login = val;
    else if (val && lastAskId === "has_glassdoor_account") patch.has_glassdoor_account = val;
    else if (val && lastAskId === "has_trade_certificate") patch.has_trade_certificate = val;
    else if (val && lastAskId === "has_platform_account") patch.profile_complete = val;
    else if (val && !patch.has_eu_login && !patch.has_glassdoor_account && !patch.has_trade_certificate) {
      patch.has_eu_login = val;
      patch.has_glassdoor_account = val;
    }
  }
  if (/\b(b1|b2|ileri)\b/.test(t)) patch.language = "b1";
  if (/\bb2\b/.test(t) && !patch.language) patch.language = "b2";
  if (/\b(a2|orta)\b/.test(t)) patch.language = "a2";
  if (/\b(a1|başlangıç)\b/.test(t)) patch.language = "a1";
  if (/\b(hiç|yok|bilmiyorum)\b/.test(t) && /dil|ingilizce|almanca/.test(t)) patch.language = "hic";
  if (/\b(0\s*[-–]?\s*1|1\s*yıl|bir yıl)\b/.test(t)) patch.experience = "0-1";
  if (/\b(2\s*[-–]?\s*4|3\s*yıl|birkaç yıl)\b/.test(t)) patch.experience = "2-4";
  if (/\b(5\s*\+|5\s*yıl|beş yıl|çok yıl)\b/.test(t)) patch.experience = "5+";
  if (/\b(engel|engelim|var)\b/.test(t) && /ülke|gidiş|yok/.test(t)) patch.barrier = "var";
  if (/\b(engel\s*yok|engelim yok)\b/.test(t)) patch.barrier = "yok";
  if (t.length >= 2 && t.length <= 40 && !patch.profession && !/^(var|yok|evet|hayır|b1|a2|emin değilim)$/i.test(t)) {
    const professionMatch = t.match(/(aşçı|kaynakçı|elektrikçi|inşaat|muhasebe|öğretmen|hemşire|mühendis|tekniker|operatör|şoför|garson|temizlik|bakım|usta|uzman)/i);
    if (professionMatch) patch.profession = professionMatch[1];
    else if (!/\?(pasaport|cv|dil|deneyim)/.test(t)) patch.profession = t;
  }
  return patch;
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    throw new Error("JSON_PARSE_FAILED");
  }
}

async function callGemini(system: string, user: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
  const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim().replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${system}\n\n---\n\nKullanıcı girdisi:\n${user}` }] }],
        generationConfig: { temperature: 0.3, topP: 0.9, maxOutputTokens: 4096 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`GEMINI_HTTP_${res.status}:${t.slice(0, 200)}`);
    }
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("") || "";
    if (!text.trim()) throw new Error("GEMINI_EMPTY_RESPONSE");
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

type NextQuestionOut = { text: string; choices?: string[] };
const DEFAULT_QUESTION: NextQuestionOut = { text: "Pasaportun var mı?", choices: ["Var", "Başvurdum", "Yok"] };

/** Gemini bazen "question"/"options" döndürür; hepsini kabul et */
function normalizeNextQuestion(parsed: Record<string, unknown>): NextQuestionOut {
  const q = parsed.next_question ?? parsed.next_questions;
  if (!q || typeof q !== "object") return DEFAULT_QUESTION;
  const obj = Array.isArray(q) ? q[0] : q;
  if (!obj || typeof obj !== "object") return DEFAULT_QUESTION;
  const o = obj as Record<string, unknown>;
  const text = (typeof o.text === "string" ? o.text : typeof o.question === "string" ? o.question : "").trim();
  const choices = Array.isArray(o.choices) ? o.choices : Array.isArray(o.options) ? o.options : [];
  const choicesStr = choices.map((c) => (typeof c === "string" ? c : (c as { label?: string })?.label ?? String(c)));
  if (!text) return DEFAULT_QUESTION;
  return { text, choices: choicesStr.length > 0 ? choicesStr : DEFAULT_QUESTION.choices };
}

/** Gemini farklı anahtarlarla mesaj dönebilir; hepsini dene, yoksa ham metni kullan */
function extractAssistantMessage(parsed: Record<string, unknown>, rawText: string): string {
  const keys = ["assistant_message", "message", "message_md", "response", "reply", "content", "text", "output", "answer"];
  for (const k of keys) {
    const v = parsed[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  const assistant = parsed.assistant;
  if (assistant && typeof assistant === "object" && assistant !== null) {
    const a = assistant as Record<string, unknown>;
    for (const k of ["message", "message_md", "text", "content"]) {
      const v = a[k];
      if (typeof v === "string" && v.trim().length > 0) return v.trim();
    }
  }
  if (typeof rawText === "string" && rawText.trim().length > 0) {
    const cleaned = rawText
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "")
      .trim();
    if (!cleaned.startsWith("{") || !cleaned.includes('"assistant_message"')) {
      const firstLine = cleaned.split("\n")[0]?.trim() ?? "";
      if (firstLine.length > 10 && firstLine.length < 2000) return firstLine;
      if (cleaned.length > 10 && cleaned.length < 4000) return cleaned.slice(0, 2000);
    }
  }
  return "";
}

type ReportFromGemini = {
  summary?: { one_liner?: string; top_actions?: string[] };
  how_to_apply?: { steps?: string[]; where_to_apply?: string; notes?: string[] };
  documents?: { required?: string[]; optional?: string[]; warnings?: string[] };
  work_permit_and_visa?: Record<string, unknown>;
  salary_and_life_calc?: Record<string, unknown>;
  risk_assessment?: { level?: string; items?: Array<{ title?: string; level?: string; why?: string; what_to_do?: string }> };
  fit_analysis?: { score?: number; strengths?: string[]; gaps?: string[] };
  plan_30_days?: { week1?: string[]; week2?: string[]; week3?: string[]; week4?: string[] };
};

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: {
      jobGuideId?: string;
      jobPostId?: string;
      user_message?: string;
      message_text?: string;
      mode?: "bootstrap" | "chat";
      last_ask_id?: string;
      answers_json?: Record<string, unknown>;
      chat_history?: Array<{ role: string; text: string }>;
      client_context?: { locale?: string };
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { jobGuideId, jobPostId, user_message, message_text, mode, last_ask_id, answers_json = {}, chat_history = [] } = body;
    if (!jobGuideId || !jobPostId) {
      return NextResponse.json({ error: "jobGuideId and jobPostId required" }, { status: 400 });
    }

    // bootstrap = ilk asistan mesajı; chat = kullanıcı cevabı sonrası
    const isBootstrap = mode === "bootstrap" || user_message === "__start__" || (typeof user_message === "string" && !user_message.trim());
    const rawUserText = (typeof message_text === "string" ? message_text : typeof user_message === "string" ? user_message : "").trim();
    const normalizedPatch = rawUserText && !isBootstrap ? normalizeUserMessageToAnswers(rawUserText, last_ask_id) : {};
    const mergedAnswers = { ...answers_json, ...normalizedPatch };

    const { data: guide } = await auth.supabase
      .from("job_guides")
      .select("id, user_id, report_json")
      .eq("id", jobGuideId)
      .eq("user_id", auth.user.id)
      .single();
    if (!guide) return NextResponse.json({ error: "Guide not found" }, { status: 404 });

    const admin = getSupabaseAdmin();
    const { data: jobPostRow } = await admin
      .from("job_posts")
      .select("id, title, position_text, location_text, source_name, source_url, snippet, published_at, channels(slug)")
      .eq("id", jobPostId)
      .maybeSingle();
    if (!jobPostRow) return NextResponse.json({ error: "Job post not found" }, { status: 404 });

    const jobPost = jobPostRow as Record<string, unknown> & { location_text?: string | null };
    const ch = (jobPost as { channels?: { slug?: string } | Array<{ slug?: string }> | null }).channels;
    const channelSlug = ch == null ? null : Array.isArray(ch) ? ch[0]?.slug ?? null : (ch as { slug?: string })?.slug ?? null;
    const country = inferCountry(channelSlug, jobPost.location_text ?? "");
    const sourceName = String(jobPost.source_name ?? "").toUpperCase();

    const jobContent = [
      `İlan başlığı: ${jobPost.title ?? ""}`,
      `Sektör/Pozisyon: ${jobPost.position_text ?? ""}`,
      `Konum: ${jobPost.location_text ?? ""}`,
      `Ülke: ${country}`,
      `İlan kaynağı: ${jobPost.source_name ?? "belirtilmedi"}`,
      `Özet: ${jobPost.snippet ?? ""}`,
    ].join("\n");

    const jobForChecklist = {
      id: jobPostId,
      title: typeof jobPost.title === "string" ? jobPost.title : null,
      location_text: typeof jobPost.location_text === "string" ? jobPost.location_text : null,
      source_name: typeof jobPost.source_name === "string" ? jobPost.source_name : null,
      source_url: typeof jobPost.source_url === "string" ? jobPost.source_url : null,
      snippet: typeof jobPost.snippet === "string" ? jobPost.snippet : null,
    };
    const answersForChecklist = answersFromJson(mergedAnswers as Record<string, unknown>);
    const modules = buildChecklist(jobForChecklist, answersForChecklist);
    const progress = calcProgress(modules);
    const missingTop3 = getMissingTop(modules, 3);
    const checklistSnapshot = { total: progress.total, done: progress.done, percent: progress.pct, missing_top3: missingTop3 };

    // Bootstrap: HER ZAMAN deterministik ilk mesaj + soru (Gemini'ye gerek yok, arayüz hep çalışır)
    if (isBootstrap) {
      const sourceLower = (jobPost.source_name ?? "").toString().toLowerCase();
      const isEures = sourceLower.includes("eures");
      const isGlassdoor = sourceLower.includes("glassdoor");
      let guideMessage: string;
      let firstQuestion: { text: string; choices: string[] };
      let askId: string;
      if (isEures) {
        guideMessage = [
          "Merhaba! Bu iş ilanı EURES üzerinden yayınlanmış. Sana hızlıca nasıl başvuracağını anlatıyorum.",
          "",
          "• İlana Git ile EURES sayfasını aç.",
          "• Sayfa İngilizceyse tarayıcıda Çevir → Türkçe yap (Chrome: adres çubuğundaki çeviri simgesi).",
          "• EURES'te başvuru için genelde EU Login hesabı gerekir; yoksa Create account ile açılır.",
          "",
          "Soru: EU Login / EURES hesabın var mı?",
        ].join("\n");
        firstQuestion = { text: "EU Login / EURES hesabın var mı?", choices: ["Var", "Yok", "Emin değilim"] };
        askId = "has_eu_login";
      } else if (isGlassdoor) {
        guideMessage = [
          "Merhaba! Bu ilan Glassdoor üzerinden geliyor. Sana hızlıca başvuru yolunu göstereceğim.",
          "",
          "• İlana Git ile Glassdoor ilanını aç.",
          "• Sayfa İngilizceyse tarayıcıda Türkçe'ye çevir.",
          "• Apply / Sign in to apply görürsen giriş yapman gerekir.",
          "",
          "Soru: Glassdoor hesabın var mı?",
        ].join("\n");
        firstQuestion = { text: "Glassdoor hesabın var mı?", choices: ["Var", "Yok", "Emin değilim"] };
        askId = "has_glassdoor_account";
      } else {
        const sourceLabel = (jobPost.source_name ?? "bu platform").toString();
        guideMessage = [
          `Bu ilan ${sourceLabel} kaynağından geliyor.`,
          "",
          "Başvurmak için:",
          "• İlanlar Cebimde'de İlana Git butonuna tıkla.",
          "• Açılan sayfada başvuru / Apply bölümünü bul.",
          "• Gerekirse tarayıcıdan sayfayı Türkçe'ye çevir.",
          "Aşağıdaki sorudan devam edelim.",
        ].join("\n");
        firstQuestion = { text: "Bu platformda veya ilan sayfasında hesabın var mı?", choices: ["Var", "Yok", "Emin değilim"] };
        askId = "has_platform_account";
      }
      // Bootstrap: DB insert beklemeden anında dön (Yanıtlanıyor takılmasın)
      const assistant = {
        message_md: guideMessage,
        quick_replies: firstQuestion.choices,
        ask: { id: askId, question: firstQuestion.text, type: "choice" as const, choices: firstQuestion.choices },
      };
      const state_patch = {
        answers_patch: {},
        checklist_patch: [],
        progress: { total: progress.total, done: progress.done, percent: progress.pct },
      };
      return NextResponse.json({
        assistant_message: guideMessage,
        next_question: firstQuestion,
        report_json: guide?.report_json ?? {},
        report_md: null,
        checklist_snapshot: checklistSnapshot,
        answers_json: mergedAnswers,
        assistant,
        state_patch,
        next: { should_finalize: false, reason: "" },
      });
    }

    const system = `Sen yurtdışı iş başvuru asistanısın. Kullanıcı lise mezunu/usta profiline uygun; kısa, net, madde madde (en fazla 5-8 madde) yaz.

KRİTİK - next_question ZORUNLU: Her yanıtta tam 1 soru dön. Format: { "text": "Soru metni", "choices": ["Var", "Yok", "Emin değilim"] }. Asla boş bırakma.
KRİTİK - checklist_patch: Cevaba göre ilgili maddeyi işaretle. Örn. kullanıcı "Var" derse answers_patch ve raporla uyumlu checklist_patch ver.

USTALIK BELGESİ: Meslek/pozisyon (aşçı, kaynakçı, elektrikçi, forklift vb.) belli olduktan sonra mutlaka sor: "Ustalık belgesi / mesleki yeterlilik belgen var mı?" options: ["Var", "Yok", "Emin değilim"]. Yoksa kısa bilgilendir: "Başvuru yine yapılır; bazı işverenler belge isteyebilir. Yapabileceğin: (1) sertifika/ustalık planı (2) deneyimi CV'de + referans ile kanıtlamak."
YouTube: Link uydurma. "YouTube'da şunu arat: [ifade]" şeklinde yönlendir.
Uydurma bilgi yok. İlan metninde yoksa "İlan metninde belirtilmiyor" de.

ÇIKTI: SADECE aşağıdaki JSON. Başka metin yok. next_question ve answers_patch zorunlu.
{
  "assistant_message": "string (Türkçe, 5-8 madde)",
  "next_question": { "text": "Tek soru metni - ZORUNLU", "choices": ["Seçenek1", "Seçenek2", "Seçenek3"] },
  "answers_patch": {},
  "report": {
    "summary": { "one_liner": "string", "top_actions": ["string","string","string"] },
    "how_to_apply": { "steps": ["string","string","string","string"], "where_to_apply": "string", "notes": ["string"] },
    "documents": { "required": ["string"], "optional": ["string"], "warnings": ["string"] },
    "work_permit_and_visa": { "sponsor_needed": "yes|no|unknown", "process_owner": "employer|candidate|unknown", "estimated_duration": "string", "risk_points": ["string"] },
    "salary_and_life_calc": { "currency": "string", "net_salary_estimate": "string", "rent_estimate": "string", "food_estimate": "string", "transport_estimate": "string", "remaining_estimate": "string", "assumptions": ["string"] },
    "risk_assessment": { "level": "low|medium|high", "items": [ { "title": "string", "level": "low|medium|high", "why": "string", "what_to_do": "string" } ] },
    "fit_analysis": { "score": 0-100, "strengths": ["string"], "gaps": ["string"] },
    "plan_30_days": { "week1": ["string"], "week2": ["string"], "week3": ["string"], "week4": ["string"] }
  }
}`;

    const userPrompt = isBootstrap
      ? `__start__ (ilk mesaj). Bu ilan için kaynak yönlendirmesi yap (${sourceName || "kaynak"}). Sonra MUTLAKA next_question ile tek bir soru sor (örn: "GLASSDOOR hesabın var mı?" veya "Pasaportun var mı?"). job_post:\n${jobContent}\n\nMevcut answers: ${JSON.stringify(mergedAnswers)}\n\nYanıtında next_question objesini mutlaka doldur.`
      : `job_post:\n${jobContent}\n\nMevcut answers:\n${JSON.stringify(mergedAnswers)}\n\nchecklist_snapshot: ${JSON.stringify(checklistSnapshot)}\n\nSohbet (son kullanıcı mesajı): ${rawUserText}\n\nYanıtında next_question ile bir sonraki soruyu mutlaka dön.`;

    const rawText = await callGemini(system, userPrompt);
    let parsed: {
      assistant_message?: string;
      next_question?: NextQuestionOut;
      answers_patch?: Record<string, unknown>;
      report?: ReportFromGemini;
    };
    try {
      parsed = extractJson(rawText) as typeof parsed;
    } catch (parseErr) {
      // Parse fail: 500 dönme, 200 + fallback dön ki UI takılmasın
      const errSnippet = typeof rawText === "string" ? rawText.slice(0, 400) : "";
      try {
        await auth.supabase.from("job_guide_events").insert({
          job_guide_id: jobGuideId,
          type: "error",
          content: JSON.stringify({ error: "JSON_PARSE_FAILED", snippet: errSnippet }),
        });
      } catch {
        /* event yazılamazsa devam et */
      }
      const fallbackMessage = "Şu an AI yanıtını işleyemedim. Yine de devam edelim: İlan sayfasında 'How to apply' veya 'Başvuru' bölümünü görüyor musun?";
      const fallbackQuestion: NextQuestionOut = { text: "İlan sayfasında başvuru bölümünü görüyor musun?", choices: ["Evet", "Hayır", "Emin değilim"] };
      const fallbackAssistant = {
        message_md: fallbackMessage,
        quick_replies: fallbackQuestion.choices ?? [],
        ask: { id: "fallback_seen", question: fallbackQuestion.text, type: "choice" as const, choices: fallbackQuestion.choices ?? ["Evet", "Hayır", "Emin değilim"] },
      };
      const fallbackStatePatch = {
        answers_patch: {} as Record<string, unknown>,
        checklist_patch: [] as Array<{ module_id: string; item_id: string; done: boolean }>,
        progress: { total: progress.total, done: progress.done, percent: progress.pct },
      };
      return NextResponse.json({
        assistant_message: fallbackMessage,
        next_question: fallbackQuestion,
        report_json: {},
        report_md: null,
        checklist_snapshot: checklistSnapshot,
        answers_json: mergedAnswers,
        assistant: fallbackAssistant,
        state_patch: fallbackStatePatch,
        next: { should_finalize: false, reason: "" },
      });
    }

    let assistantMessage = extractAssistantMessage(parsed as Record<string, unknown>, rawText);
    if (!assistantMessage.trim()) {
      assistantMessage = "Kısa bir yanıt geldi; devam edelim. İlan sayfasında başvuru bölümünü görüyor musun?";
    }
    const nextQuestion = normalizeNextQuestion(parsed as Record<string, unknown>);
    const answersPatch = (parsed.answers_patch && typeof parsed.answers_patch === "object") ? parsed.answers_patch : {};
    const finalAnswers = { ...mergedAnswers, ...answersPatch };
    const reportFromGemini = (parsed.report && typeof parsed.report === "object") ? parsed.report : {};
    const reportJson = mapGeminiReportToOur(reportFromGemini);
    const reportMd = buildReportMd(reportJson, reportFromGemini);

    const score = typeof reportFromGemini.fit_analysis?.score === "number"
      ? Math.max(0, Math.min(100, reportFromGemini.fit_analysis.score))
      : undefined;
    const riskLevel = (reportFromGemini.risk_assessment?.level === "low" || reportFromGemini.risk_assessment?.level === "medium" || reportFromGemini.risk_assessment?.level === "high")
      ? reportFromGemini.risk_assessment.level
      : undefined;

    await auth.supabase
      .from("job_guides")
      .update({
        answers_json: finalAnswers,
        report_json: reportJson,
        report_md: reportMd,
        updated_at: new Date().toISOString(),
        status: "in_progress",
        ...(score != null ? { score } : {}),
        ...(riskLevel ? { risk_level: riskLevel } : {}),
      })
      .eq("id", jobGuideId)
      .eq("user_id", auth.user.id);

    if (rawUserText && !isBootstrap) {
      await auth.supabase.from("job_guide_events").insert({
        job_guide_id: jobGuideId,
        type: "user_message",
        content: rawUserText,
      });
    }
    await auth.supabase.from("job_guide_events").insert({
      job_guide_id: jobGuideId,
      type: "assistant_message",
      content: JSON.stringify({ message: assistantMessage, next_question: nextQuestion }),
    });

    // Yeni şema: assistant + state_patch + next (mega prompt uyumlu)
    const assistant = {
      message_md: assistantMessage,
      quick_replies: nextQuestion.choices ?? [],
      ask: {
        id: "q_next",
        question: nextQuestion.text,
        type: "choice" as const,
        choices: nextQuestion.choices ?? ["Var", "Başvurdum", "Yok"],
      },
    };
    const state_patch = {
      answers_patch: answersPatch,
      checklist_patch: [] as Array<{ module_id: string; item_id: string; done: boolean }>,
      progress: { total: progress.total, done: progress.done, percent: progress.pct },
    };
    const next = { should_finalize: false, reason: "" };

    return NextResponse.json({
      assistant_message: assistantMessage,
      next_question: nextQuestion,
      report_json: reportJson,
      report_md: reportMd,
      checklist_snapshot: checklistSnapshot,
      score: score ?? undefined,
      risk_level: riskLevel ?? undefined,
      answers_json: finalAnswers,
      // Yeni şema (ChatGPT tarzı UI için)
      assistant,
      state_patch,
      next,
    });
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : "unknown_error");
    if (msg.includes("GEMINI_API_KEY_MISSING")) return NextResponse.json({ error: "gemini_not_configured" }, { status: 503 });
    return NextResponse.json({ error: "internal_error", detail: msg.slice(0, 200) }, { status: 500 });
  }
}

function mapGeminiReportToOur(r: ReportFromGemini): Record<string, unknown> {
  const summary = r.summary?.one_liner ?? "";
  const topActions = r.summary?.top_actions ?? [];
  const howTo = r.how_to_apply;
  const rehber = Array.isArray(howTo?.steps) ? howTo.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") : "";
  const docs = r.documents;
  const belgeler = [
    Array.isArray(docs?.required) ? "Gerekli: " + docs.required.join(", ") : "",
    Array.isArray(docs?.optional) ? "Opsiyonel: " + docs.optional.join(", ") : "",
    Array.isArray(docs?.warnings) ? "Uyarılar: " + docs.warnings.join("; ") : "",
  ].filter(Boolean).join("\n");
  const visa = r.work_permit_and_visa;
  const vizeText = visa && typeof visa === "object" ? JSON.stringify(visa) : "";
  const sal = r.salary_and_life_calc as Record<string, unknown> | undefined;
  const maasText = sal ? [sal.net_salary_estimate, sal.rent_estimate, sal.food_estimate, sal.remaining_estimate].filter(Boolean).join(" · ") : "";
  const risk = r.risk_assessment;
  const riskText = Array.isArray(risk?.items) ? risk.items.map((i) => `${i.title ?? ""}: ${i.what_to_do ?? ""}`).join("\n") : (risk?.level ?? "");
  const fit = r.fit_analysis;
  const sanaOzel = [...(fit?.strengths ?? []), ...(fit?.gaps ?? [])].join("\n");
  const plan = r.plan_30_days;
  const planText = [
    plan?.week1?.length ? "Hafta 1: " + plan.week1.join("; ") : "",
    plan?.week2?.length ? "Hafta 2: " + plan.week2.join("; ") : "",
    plan?.week3?.length ? "Hafta 3: " + plan.week3.join("; ") : "",
    plan?.week4?.length ? "Hafta 4: " + plan.week4.join("; ") : "",
  ].filter(Boolean).join("\n");
  return {
    summary,
    top_actions: topActions,
    rehber,
    belgeler,
    vize_izin: vizeText,
    maas_yasam: maasText,
    risk: riskText,
    sana_ozel: sanaOzel,
    plan_30_gun: planText,
    score: typeof fit?.score === "number" ? fit.score : undefined,
  };
}

function buildReportMd(reportJson: Record<string, unknown>, r: ReportFromGemini): string {
  const parts = [
    "# Bu İlan İçin Nasıl Başvururum\n",
    reportJson.score != null ? `## Uygunluk Skoru: ${reportJson.score}/100\n` : "",
    `## Özet\n${String(reportJson.summary ?? "")}\n`,
    Array.isArray(reportJson.top_actions) && reportJson.top_actions.length ? `## Öncelikli 3 Aksiyon\n${reportJson.top_actions.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")}\n` : "",
    reportJson.rehber ? "## Bu İşe Nasıl Başvurulur?\n" + reportJson.rehber + "\n" : "",
    reportJson.belgeler ? "\n## Gerekli Belgeler\n" + reportJson.belgeler + "\n" : "",
    reportJson.vize_izin ? "\n## Çalışma İzni ve Vize\n" + reportJson.vize_izin + "\n" : "",
    reportJson.maas_yasam ? "\n## Maaş ve Yaşam\n" + reportJson.maas_yasam + "\n" : "",
    reportJson.risk ? "\n## Risk Değerlendirmesi\n" + reportJson.risk + "\n" : "",
    reportJson.sana_ozel ? "\n## Sana Özel Analiz\n" + reportJson.sana_ozel + "\n" : "",
    reportJson.plan_30_gun ? "\n## 30 Günlük Plan\n" + reportJson.plan_30_gun + "\n" : "",
  ];
  return parts.join("");
}
