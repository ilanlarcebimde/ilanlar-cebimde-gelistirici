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

type SourceKind = "eures" | "glassdoor" | "default";
function getSourceKind(sourceName: string | null): SourceKind {
  const s = (sourceName ?? "").toLowerCase();
  if (s.includes("eures")) return "eures";
  if (s.includes("glassdoor")) return "glassdoor";
  return "default";
}

/** Deterministik soru sırası: kritik alanlar asla atlanmaz. */
const QUESTION_FLOW: Record<SourceKind, readonly string[]> = {
  eures: ["has_eu_login", "source_apply_opened", "source_apply_found", "source_apply_started", "passport", "cv", "language", "has_trade_certificate", "barrier"],
  glassdoor: ["has_glassdoor_account", "source_apply_opened", "source_apply_found", "source_apply_started", "passport", "cv", "language", "has_trade_certificate", "barrier"],
  default: ["has_glassdoor_account", "source_apply_opened", "source_apply_found", "source_apply_started", "passport", "cv", "language", "has_trade_certificate", "barrier"],
};

function isAnswered(answers: Record<string, unknown>, id: string): boolean {
  const v = id === "passport" ? answers.passport : answers[id];
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function pickNextQuestion(answers: Record<string, unknown>, source: SourceKind): string | null {
  const flow = QUESTION_FLOW[source];
  for (const id of flow) {
    if (!isAnswered(answers, id)) return id;
  }
  return null;
}

const STEP_QUESTIONS: Record<string, { text: string; choices: string[] }> = {
  has_eu_login: { text: "EURES'te EU Login hesabın var mı?", choices: ["Var", "Yok", "Emin değilim"] },
  has_glassdoor_account: { text: "Glassdoor hesabın var mı?", choices: ["Var", "Yok", "Emin değilim"] },
  source_apply_opened: { text: "İlana gittin mi? Sayfayı açtın mı?", choices: ["Evet", "Hayır", "Emin değilim"] },
  source_apply_found: { text: "How to apply / Apply bölümünü gördün mü?", choices: ["Gördüm", "Görmedim", "Emin değilim"] },
  source_apply_started: { text: "Başvuruyu başlattın mı? Form açıldı mı?", choices: ["Evet", "Hayır", "Emin değilim"] },
  passport: { text: "Pasaportun var mı?", choices: ["Var", "Başvurdum", "Yok"] },
  cv: { text: "CV hazır mı? (PDF)", choices: ["Var", "Yok", "Emin değilim"] },
  language: { text: "İngilizce (veya ilan dilinde) seviyen nasıl?", choices: ["Hiç / Yok", "A1–A2", "B1–B2", "İleri"] },
  has_trade_certificate: { text: "Ustalık belgesi / mesleki yeterlilik belgen var mı?", choices: ["Var", "Yok", "Emin değilim"] },
  barrier: { text: "Yurtdışına gidişte engel (sağlık, aile vb.) var mı?", choices: ["Yok", "Var", "Emin değilim"] },
};

function getQuestionTextAndChoices(id: string, source: SourceKind): { text: string; choices: string[] } {
  if (source === "default" && id === "has_glassdoor_account")
    return { text: "Bu platformda hesabın var mı?", choices: ["Var", "Yok", "Emin değilim"] };
  const q = STEP_QUESTIONS[id];
  if (q) return q;
  return { text: "Devam edelim.", choices: ["Var", "Yok", "Emin değilim"] };
}

/** Serbest metin cevabı answers patch'ine çevirir. last_ask_id ile tek doğru alana yazılır (tekrar döngüsü önlenir). */
function normalizeUserMessageToAnswers(text: string, lastAskId?: string): Record<string, unknown> {
  const t = text.toLowerCase().trim();
  const patch: Record<string, unknown> = {};
  if (!lastAskId) {
    if (/\b(pasaportum\s*yok|pasaport\s*yok)\b/.test(t)) patch.passport = "yok";
    else if (/\b(pasaportum\s*var|pasaport\s*var)\b/.test(t)) patch.passport = "var";
    else if (/\b(başvurdum|basvurdum)\b/.test(t)) patch.passport = "basvurdum";
    if (/\b(cv\s*yok|cv hazır değil)\b/.test(t)) { patch.cv = "yok"; patch.cv_uploaded = "yok"; }
    else if (/\b(cv\s*var|cv hazır|hazır|cv yükledim)\b/.test(t)) { patch.cv = "var"; }
    if (/\b(eu\s*login|eures).*var|var.*eures/.test(t)) patch.has_eu_login = "var";
    else if (/\b(eures).*yok/.test(t)) patch.has_eu_login = "yok";
    if (/\b(glassdoor).*var|var.*glassdoor/.test(t)) patch.has_glassdoor_account = "var";
    else if (/\b(glassdoor).*yok/.test(t)) patch.has_glassdoor_account = "yok";
    if (/\b(ilan\s*sayfasına\s*geldim|ilana\s*gittim|sayfayı\s*açtım)\b/.test(t)) patch.source_apply_opened = "var";
    if (/\b(apply\s*bölümünü\s*gördüm|gördüm)\b/.test(t)) patch.source_apply_found = "var";
    if (/\b(başvuruyu\s*başlattım|form\s*açıldı)\b/.test(t)) patch.source_apply_started = "var";
    if (/\b(hiç|yok|bilmiyorum)\b/.test(t) && /dil|ingilizce/.test(t)) patch.language = "hic";
    if (/\b(a1|başlangıç)\b/.test(t)) patch.language = "a1";
    if (/\b(a2|orta)\b/.test(t)) patch.language = "a2";
    if (/\b(b1|b2|ileri)\b/.test(t)) patch.language = "b1";
    if (/\b(engel\s*yok|engelim yok)\b/.test(t)) patch.barrier = "yok";
    if (/\b(engel|engelim)\s*var/.test(t)) patch.barrier = "var";
  } else {
    if (t === "evet" || t === "var" || t === "gördüm") {
      if (lastAskId === "has_eu_login") patch.has_eu_login = "var";
      else if (lastAskId === "has_glassdoor_account") patch.has_glassdoor_account = "var";
      else if (lastAskId === "source_apply_opened") patch.source_apply_opened = "var";
      else if (lastAskId === "source_apply_found") patch.source_apply_found = "var";
      else if (lastAskId === "source_apply_started") patch.source_apply_started = "var";
      else if (lastAskId === "cv") { patch.cv = "var"; }
      else if (lastAskId === "has_trade_certificate") patch.has_trade_certificate = "var";
      else if (lastAskId === "barrier") patch.barrier = "var";
    } else if (t === "hayır" || t === "yok" || t === "görmedim") {
      if (lastAskId === "has_eu_login") patch.has_eu_login = "yok";
      else if (lastAskId === "has_glassdoor_account") patch.has_glassdoor_account = "yok";
      else if (lastAskId === "source_apply_opened") patch.source_apply_opened = "yok";
      else if (lastAskId === "source_apply_found") patch.source_apply_found = "yok";
      else if (lastAskId === "source_apply_started") patch.source_apply_started = "yok";
      else if (lastAskId === "passport") patch.passport = "yok";
      else if (lastAskId === "cv") { patch.cv = "yok"; patch.cv_uploaded = "yok"; }
      else if (lastAskId === "has_trade_certificate") patch.has_trade_certificate = "yok";
      else if (lastAskId === "barrier") patch.barrier = "yok";
    } else if (t === "başvurdum" || t === "basvurdum") {
      if (lastAskId === "passport") patch.passport = "basvurdum";
    } else if (t === "emin değilim") {
      if (lastAskId === "has_eu_login") patch.has_eu_login = "yok";
      else if (lastAskId === "has_glassdoor_account") patch.has_glassdoor_account = "yok";
      else if (lastAskId === "source_apply_opened") patch.source_apply_opened = "yok";
      else if (lastAskId === "source_apply_found") patch.source_apply_found = "yok";
      else if (lastAskId === "source_apply_started") patch.source_apply_started = "yok";
      else if (lastAskId === "cv") patch.cv = "yok";
      else if (lastAskId === "has_trade_certificate") patch.has_trade_certificate = "yok";
      else if (lastAskId === "barrier") patch.barrier = "yok";
    } else if (lastAskId === "language") {
      if (/\b(hiç|yok|bilmiyorum)\b/.test(t)) patch.language = "hic";
      else if (/\b(a1|başlangıç)\b/.test(t)) patch.language = "a1";
      else if (/\b(a2|orta)\b/.test(t)) patch.language = "a2";
      else if (/\b(b1|b2|ileri)\b/.test(t)) patch.language = "b1";
      else if (t.length <= 10) patch.language = t;
    }
  }
  if (/\b(cv\s*yükledim|yükledim)\b/.test(t)) patch.cv_uploaded = "var";
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

type NextQuestionOut = { id?: string; text: string; choices?: string[] };
const DEFAULT_QUESTION: NextQuestionOut = { text: "Pasaportun var mı?", choices: ["Var", "Başvurdum", "Yok"] };

/** Gemini bazen "question"/"options"/"id" döndürür; hepsini kabul et */
function normalizeNextQuestion(parsed: Record<string, unknown>): NextQuestionOut {
  const q = parsed.next_question ?? parsed.next_questions;
  if (!q || typeof q !== "object") return DEFAULT_QUESTION;
  const obj = Array.isArray(q) ? q[0] : q;
  if (!obj || typeof obj !== "object") return DEFAULT_QUESTION;
  const o = obj as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() || undefined : undefined;
  const text = (typeof o.text === "string" ? o.text : typeof o.question === "string" ? o.question : "").trim();
  const choices = Array.isArray(o.choices) ? o.choices : Array.isArray(o.options) ? o.options : [];
  const choicesStr = choices.map((c) => (typeof c === "string" ? c : (c as { label?: string })?.label ?? String(c)));
  if (!text) return DEFAULT_QUESTION;
  return { id, text, choices: choicesStr.length > 0 ? choicesStr : DEFAULT_QUESTION.choices };
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
  const hasAuth = !!req.headers.get("authorization");
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) {
      console.log("[job-guide/chat] hit", { hasAuth, status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.log("[job-guide/chat] body", { hasMessage: !!rawUserText, jobGuideId, jobPostId, mode: body.mode, isBootstrap });
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

    // Bootstrap: deterministik ilk soru (pickNextQuestion + getQuestionTextAndChoices)
    const sourceKey = getSourceKind(jobPost.source_name as string | null);
    if (isBootstrap) {
      const nextId = pickNextQuestion(mergedAnswers as Record<string, unknown>, sourceKey);
      const firstQuestion = nextId ? getQuestionTextAndChoices(nextId, sourceKey) : { text: "Adımlar tamamlandı.", choices: [] };
      const askId = nextId ?? "done";
      const sourceLower = (jobPost.source_name ?? "").toString().toLowerCase();
      const isEures = sourceLower.includes("eures");
      const isGlassdoor = sourceLower.includes("glassdoor");
      let guideMessage: string;
      if (isEures) {
        guideMessage = [
          "Merhaba! Bu ilan EURES üzerinden geliyor.",
          "• \"İlana Git\" ile EURES sayfasını aç.",
          "• Sayfa İngilizceyse: Chrome → sağ tık → Türkçeye çevir.",
          "• \"How to apply\" / \"Apply\" bölümünü bul.",
          "• Başvuru için çoğu ilanda EU Login ile giriş istenir.",
        ].join("\n");
      } else if (isGlassdoor) {
        guideMessage = [
          "Merhaba! Bu ilan Glassdoor üzerinden geliyor.",
          "• \"İlana Git\" ile ilan sayfasını aç.",
          "• Chrome → sağ tık → Türkçeye çevir.",
          "• \"Apply\" / \"Sign in to apply\" alanını görürsen başvuru buradan yapılır.",
          "• Giriş istenirse hesap açıp devam edeceğiz.",
        ].join("\n");
      } else {
        const sourceLabel = (jobPost.source_name ?? "bu platform").toString();
        guideMessage = [
          `Bu ilan ${sourceLabel} kaynağından geliyor.`,
          "• İlana Git ile sayfayı aç.",
          "• Başvuru / Apply bölümünü bul.",
          "• Gerekirse sayfayı Türkçeye çevir.",
        ].join("\n");
      }
      // Bootstrap: DB insert beklemeden anında dön (Yanıtlanıyor takılmasın)
      const nextQuestionPayload = nextId ? { id: askId, text: firstQuestion.text, choices: firstQuestion.choices } : null;
      const assistant = {
        message_md: guideMessage,
        quick_replies: firstQuestion.choices,
        ask: nextQuestionPayload ? { id: askId, question: firstQuestion.text, type: "choice" as const, choices: firstQuestion.choices } : undefined,
      };
      const state_patch = {
        answers_patch: {},
        checklist_patch: [],
        progress: { total: progress.total, done: progress.done, percent: progress.pct },
      };
      return NextResponse.json({
        assistant_message: guideMessage,
        next_question: nextQuestionPayload,
        report_json: guide?.report_json ?? {},
        report_md: null,
        checklist_snapshot: checklistSnapshot,
        answers_json: mergedAnswers,
        assistant,
        state_patch,
        next: { should_finalize: false, reason: "" },
      });
    }

    // Chat: sıradaki soru sunucuda belirlenir (deterministik), Gemini sadece rehber üretir
    const nextId = pickNextQuestion(mergedAnswers as Record<string, unknown>, sourceKey);
    if (nextId === null) {
      const doneMessage = "Tüm kritik adımlar tamamlandı. Rapor ve özeti aşağıda görebilirsin.";
      const state_patch = {
        answers_patch: {} as Record<string, unknown>,
        checklist_patch: [] as Array<{ module_id: string; item_id: string; done: boolean }>,
        progress: { total: progress.total, done: progress.done, percent: progress.pct },
      };
      return NextResponse.json({
        assistant_message: doneMessage,
        next_question: null,
        report_json: guide?.report_json ?? {},
        report_md: null,
        checklist_snapshot: checklistSnapshot,
        answers_json: mergedAnswers,
        assistant: { message_md: doneMessage, quick_replies: [], ask: undefined },
        state_patch,
        next: { should_finalize: true, reason: "all_steps_done" },
      });
    }
    const currentStepId = nextId;
    const system = `Sen "Yurtdışı İş Başvuru Asistanı"sın. Kullanıcı hiçbir şey bilmiyor olabilir.
Görevin: SADECE kısa, net ve sonuç odaklı rehber metni üretmek.

ÖNEMLİ:
- SORU ÜRETME. "next_question" üretme. Seçenek üretme.
- Tekrar yapma. Aynı maddeyi farklı cümleyle yeniden yazma.
- 3–7 madde ile sınırlı kal. Uzun paragraf yazma.
- Link verme. YouTube gerekiyorsa: "YouTube'da şunu arat: …" de.
- Uydurma yapma. İlanda yoksa "İlan metninde belirtilmiyor" de.
- Çıktın SADECE JSON olacak.

Girdi: job_post, source, location, current_step_id (sistemin sorduğu kritik soru), user_last_message, answers_json.

ÇIKTI JSON ŞEMASI:
{
  "assistant_message": "3-7 maddelik rehber (Türkçe)",
  "micro_tips": ["en fazla 3 kısa ipucu"],
  "report_patch": { "notes": ["kısa notlar"] }
}

Rehber yazarken current_step_id'ye göre odaklan:
- has_eu_login / has_glassdoor_account: hesap açma/giriş adımları
- source_apply_opened: "İlana Git" + sayfayı Türkçeye çevir
- source_apply_found: "How to apply/Apply" bölümünü nasıl bulacağı
- source_apply_started: başvuruyu başlatma / form adımı
- passport: pasaport neden kritik, yoksa ilk yapılacak
- cv: CV'yi 2-3 maddede nasıl hazırlayacağı (PDF)
- language: düşükse kısa uyarı ve pratik öneri
- has_trade_certificate: varsa ekle, yoksa alternatif (deneyim/ustabaşı referansı vb.)
- barrier: varsa neyi kastettiğini netleştirme (tek cümle)`;

    const userPrompt = `job_post:\n${jobContent}\n\nsource: ${sourceName || "kaynak"}\nlocation: ${jobPost.location_text ?? ""}\ncurrent_step_id: ${currentStepId}\nuser_last_message: ${rawUserText}\nanswers_json: ${JSON.stringify(mergedAnswers)}`;

    console.log("[job-guide/chat] calling Gemini");
    let rawText: string;
    try {
      rawText = await callGemini(system, userPrompt);
      console.log("[job-guide/chat] gemini ok", { len: rawText?.length ?? 0 });
    } catch (geminiErr) {
      console.error("[job-guide/chat] gemini fail", geminiErr);
      throw geminiErr;
    }
    let parsed: {
      assistant_message?: string;
      micro_tips?: string[];
      report_patch?: { notes?: string[] };
      report?: ReportFromGemini;
    };
    try {
      parsed = extractJson(rawText) as typeof parsed;
    } catch (parseErr) {
      console.error("[job-guide/chat] parse fail", parseErr);
      const errSnippet = typeof rawText === "string" ? rawText.slice(0, 400) : "";
      try {
        await auth.supabase.from("job_guide_events").insert({
          job_guide_id: jobGuideId,
          type: "error",
          content: JSON.stringify({ error: "JSON_PARSE_FAILED", snippet: errSnippet }),
        });
      } catch {
        /* ignore */
      }
      const fallbackMessage = "Şu an AI yanıtını işleyemedim. Yine de devam edelim.";
      const serverNext = getQuestionTextAndChoices(currentStepId, sourceKey);
      const fallbackQuestion = { id: currentStepId, text: serverNext.text, choices: serverNext.choices };
      const fallbackAssistant = {
        message_md: fallbackMessage,
        quick_replies: fallbackQuestion.choices,
        ask: { id: currentStepId, question: fallbackQuestion.text, type: "choice" as const, choices: fallbackQuestion.choices },
      };
      return NextResponse.json({
        assistant_message: fallbackMessage,
        next_question: fallbackQuestion,
        report_json: {},
        report_md: null,
        checklist_snapshot: checklistSnapshot,
        answers_json: mergedAnswers,
        assistant: fallbackAssistant,
        state_patch: { answers_patch: {}, checklist_patch: [], progress: { total: progress.total, done: progress.done, percent: progress.pct } },
        next: { should_finalize: false, reason: "" },
      });
    }

    let assistantMessage = extractAssistantMessage(parsed as Record<string, unknown>, rawText);
    if (!assistantMessage.trim()) {
      assistantMessage = "Kısa bir yanıt geldi; devam edelim.";
    }
    const finalAnswers = mergedAnswers as Record<string, unknown>;
    const reportFromGemini = (parsed.report && typeof parsed.report === "object") ? parsed.report : {};
    const reportJson = mapGeminiReportToOur(reportFromGemini);
    const reportMd = buildReportMd(reportJson, reportFromGemini);
    if (parsed.report_patch && typeof parsed.report_patch === "object" && Array.isArray(parsed.report_patch.notes)) {
      (reportJson as { notes?: string[] }).notes = [...((reportJson as { notes?: string[] }).notes ?? []), ...parsed.report_patch.notes];
    }

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

    if (rawUserText) {
      await auth.supabase.from("job_guide_events").insert({
        job_guide_id: jobGuideId,
        type: "user_message",
        content: rawUserText,
      });
    }
    const serverNextQuestion = getQuestionTextAndChoices(currentStepId, sourceKey);
    const nextQuestionPayload = { id: currentStepId, text: serverNextQuestion.text, choices: serverNextQuestion.choices };
    await auth.supabase.from("job_guide_events").insert({
      job_guide_id: jobGuideId,
      type: "assistant_message",
      content: JSON.stringify({ message: assistantMessage, next_question: nextQuestionPayload }),
    });

    const assistant = {
      message_md: assistantMessage,
      quick_replies: serverNextQuestion.choices,
      ask: {
        id: currentStepId,
        question: serverNextQuestion.text,
        type: "choice" as const,
        choices: serverNextQuestion.choices,
      },
    };
    const state_patch = {
      answers_patch: {} as Record<string, unknown>,
      checklist_patch: [] as Array<{ module_id: string; item_id: string; done: boolean }>,
      progress: { total: progress.total, done: progress.done, percent: progress.pct },
    };
    const next = { should_finalize: false, reason: "" };

    return NextResponse.json({
      assistant_message: assistantMessage,
      next_question: nextQuestionPayload,
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
    console.error("[job-guide/chat] error", msg, e);
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
