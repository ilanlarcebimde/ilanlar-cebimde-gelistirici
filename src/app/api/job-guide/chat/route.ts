import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForUser, getSupabaseAdmin } from "@/lib/supabase/server";

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
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${system}\n\n---\n\nKullanıcı girdisi:\n${user}` }] }],
      generationConfig: { temperature: 0.3, topP: 0.9, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`GEMINI_HTTP_${res.status}:${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("") || "";
  if (!text.trim()) throw new Error("GEMINI_EMPTY_RESPONSE");
  return text;
}

type NextQuestion = { id: string; question: string; type: string; options?: string[] };
type ReportUpdate = {
  summary?: string;
  top_actions?: string[];
  how_to_apply?: string[];
  documents?: string[];
  visa?: string[];
  budget?: { currency?: string; net?: string; rent?: string; food?: string; remaining?: string; assumptions?: string[] };
  risk?: Array<{ title?: string; level?: string; what_to_do?: string }>;
  fit?: { score?: number; strengths?: string[]; gaps?: string[] };
  plan_30_days?: { week1?: string[]; week2?: string[]; week3?: string[]; week4?: string[] };
};
type UiHints = { progress_percent?: number; unlock?: string[]; missing_top3?: string[] };

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: {
      jobGuideId?: string;
      jobPostId?: string;
      user_message?: string;
      answers_json?: Record<string, unknown>;
      chat_history?: Array<{ role: string; text: string }>;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { jobGuideId, jobPostId, user_message, answers_json = {}, chat_history = [] } = body;
    if (!jobGuideId || !jobPostId) {
      return NextResponse.json({ error: "jobGuideId and jobPostId required" }, { status: 400 });
    }

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
      .select("id, title, position_text, location_text, source_name, snippet, published_at, channels(slug)")
      .eq("id", jobPostId)
      .maybeSingle();
    if (!jobPostRow) return NextResponse.json({ error: "Job post not found" }, { status: 404 });

    const jobPost = jobPostRow as Record<string, unknown> & { location_text?: string | null };
    const ch = (jobPost as { channels?: { slug?: string } | Array<{ slug?: string }> | null }).channels;
    const channelSlug = ch == null ? null : Array.isArray(ch) ? ch[0]?.slug ?? null : (ch as { slug?: string })?.slug ?? null;
    const country = inferCountry(channelSlug, jobPost.location_text ?? "");

    const jobContent = [
      `İlan başlığı: ${jobPost.title ?? ""}`,
      `Sektör/Pozisyon: ${jobPost.position_text ?? ""}`,
      `Konum: ${jobPost.location_text ?? ""}`,
      `Ülke: ${country}`,
      `İlan kaynağı: ${jobPost.source_name ?? "belirtilmedi"}`,
      `Özet: ${jobPost.snippet ?? ""}`,
    ].join("\n");

    const isFirst = !user_message?.trim() && chat_history.length === 0;
    const system = `Sen yurtdışı iş başvuru asistanısın. Sohbet şeklinde ilerliyorsun: kısa, net, madde madde. Uydurma bilgi yok; ilan metninde yoksa "İlan metninde belirtilmiyor" de.
where_to_apply: Sadece platform/site adı ve menü yolu (link yok). Maaş/kira: kesin rakam uydurma; tahmini aralık + assumptions zorunlu.

ÇIKTI: SADECE aşağıdaki JSON. Başka metin yok.
{
  "assistant_message": "string (1-2 kısa paragraf veya maddeler)",
  "next_questions": [
    { "id": "q_xxx", "question": "string", "type": "single_choice", "options": ["A","B","C"] }
  ],
  "answers_update": { "key": "value" },
  "report_update": {
    "summary": "string",
    "top_actions": ["string"],
    "how_to_apply": ["string"],
    "documents": ["string"],
    "visa": ["string"],
    "budget": { "currency": "EUR", "net": "tahmini aralık", "rent": "...", "food": "...", "remaining": "...", "assumptions": ["..."] },
    "risk": [{ "title": "string", "level": "low|medium|high", "what_to_do": "string" }],
    "fit": { "score": 0-100, "strengths": ["string"], "gaps": ["string"] },
    "plan_30_days": { "week1": ["string"], "week2": ["string"], "week3": ["string"], "week4": ["string"] }
  },
  "ui_hints": { "progress_percent": 0-100, "unlock": ["visa","budget"], "missing_top3": ["string","string","string"] }
}
Ülke, başlık ve kaynağa göre 1-3 soru sor (pasaport, CV, dil vb.). Dinamik soru üret.`;

    const userPrompt = isFirst
      ? `İlk mesaj: Kullanıcı henüz bir şey yazmadı. Bu ilan için hoş geldin mesajı + 2-3 soru öner (next_questions). job_post:\n${jobContent}\n\nMevcut answers: ${JSON.stringify(answers_json)}`
      : `job_post:\n${jobContent}\n\nMevcut answers:\n${JSON.stringify(answers_json)}\n\nSohbet geçmişi:\n${chat_history.map((m) => `${m.role}: ${m.text}`).join("\n")}\n\nSon kullanıcı mesajı: ${user_message}`;

    const rawText = await callGemini(system, userPrompt);
    const parsed = extractJson(rawText) as {
      assistant_message?: string;
      next_questions?: NextQuestion[];
      answers_update?: Record<string, unknown>;
      report_update?: ReportUpdate;
      ui_hints?: UiHints;
    };

    const assistantMessage = typeof parsed.assistant_message === "string" ? parsed.assistant_message : "";
    const nextQuestions = Array.isArray(parsed.next_questions) ? parsed.next_questions : [];
    const answersUpdate = (parsed.answers_update && typeof parsed.answers_update === "object") ? parsed.answers_update : {};
    const reportUpdate = (parsed.report_update && typeof parsed.report_update === "object") ? parsed.report_update : {};
    const uiHints = (parsed.ui_hints && typeof parsed.ui_hints === "object") ? parsed.ui_hints : {};

    const newAnswers = { ...answers_json, ...answersUpdate };
    const existingReport = (guide.report_json as Record<string, unknown>) ?? {};
    const mergedReport = deepMergeReport(existingReport, reportUpdate);

    const scoreFromFit = typeof reportUpdate.fit?.score === "number"
      ? Math.max(0, Math.min(100, reportUpdate.fit.score))
      : undefined;
    const riskLevel = (reportUpdate.risk?.[0] as { level?: string } | undefined)?.level;
    const validRisk = riskLevel === "low" || riskLevel === "medium" || riskLevel === "high" ? riskLevel : undefined;
    await auth.supabase
      .from("job_guides")
      .update({
        answers_json: newAnswers,
        report_json: mergedReport,
        updated_at: new Date().toISOString(),
        ...(typeof uiHints.progress_percent === "number" && uiHints.progress_percent >= 0 && uiHints.progress_percent <= 100
          ? { progress_step: Math.max(1, Math.min(7, Math.round((uiHints.progress_percent / 100) * 7))) }
          : {}),
        ...(scoreFromFit != null ? { score: scoreFromFit } : {}),
        ...(validRisk ? { risk_level: validRisk } : {}),
      })
      .eq("id", jobGuideId)
      .eq("user_id", auth.user.id);

    if (user_message?.trim()) {
      await auth.supabase.from("job_guide_events").insert({
        job_guide_id: jobGuideId,
        type: "user_message",
        content: user_message.trim(),
      });
    }
    await auth.supabase.from("job_guide_events").insert({
      job_guide_id: jobGuideId,
      type: "assistant_message",
      content: JSON.stringify({ message: assistantMessage, next_questions: nextQuestions, ui_hints: uiHints }),
    });

    return NextResponse.json({
      assistant_message: assistantMessage,
      next_questions: nextQuestions,
      answers_update: answersUpdate,
      report_update: reportUpdate,
      ui_hints: uiHints,
      answers_json: newAnswers,
      report_json: mergedReport,
    });
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : "unknown_error");
    if (msg.includes("GEMINI_API_KEY_MISSING")) return NextResponse.json({ error: "gemini_not_configured" }, { status: 503 });
    return NextResponse.json({ error: "internal_error", detail: msg.slice(0, 200) }, { status: 500 });
  }
}

function deepMergeReport(
  existing: Record<string, unknown>,
  update: ReportUpdate
): Record<string, unknown> {
  const out = { ...existing };
  if (update.summary != null) out.summary = update.summary;
  if (Array.isArray(update.top_actions)) out.top_actions = update.top_actions;
  if (Array.isArray(update.how_to_apply)) {
    out.rehber = update.how_to_apply.map((s, i) => `${i + 1}. ${s}`).join("\n");
  }
  if (Array.isArray(update.documents)) out.belgeler = update.documents.join("\n");
  if (Array.isArray(update.visa)) out.vize_izin = update.visa.join("\n");
  if (update.budget && typeof update.budget === "object") {
    const b = update.budget;
    out.maas_yasam = [b.net, b.rent, b.food, b.remaining].filter(Boolean).join(" · ");
    if (Array.isArray(b.assumptions)) (out as Record<string, unknown>).budget_assumptions = b.assumptions;
  }
  if (Array.isArray(update.risk)) {
    out.risk = update.risk.map((r) => `${r.title ?? ""}: ${r.what_to_do ?? ""}`).join("\n");
  }
  if (update.fit && typeof update.fit === "object") {
    out.sana_ozel = [...(update.fit.strengths ?? []), ...(update.fit.gaps ?? [])].join("\n");
    if (typeof update.fit.score === "number") out.score = update.fit.score;
  }
  if (update.plan_30_days && typeof update.plan_30_days === "object") {
    const p = update.plan_30_days;
    out.plan_30_gun = [
      p.week1?.length ? "Hafta 1: " + p.week1.join("; ") : "",
      p.week2?.length ? "Hafta 2: " + p.week2.join("; ") : "",
      p.week3?.length ? "Hafta 3: " + p.week3.join("; ") : "",
      p.week4?.length ? "Hafta 4: " + p.week4.join("; ") : "",
    ].filter(Boolean).join("\n");
  }
  return out;
}
