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

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
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
  const userPromptWithSystem = `${system}\n\n---\n\nKullanıcı girdisi:\n${user}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userPromptWithSystem }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 4096,
      },
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

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { jobGuideId?: string; jobPostId?: string; answers_json?: Record<string, unknown> };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const jobGuideId = body?.jobGuideId;
    const jobPostId = body?.jobPostId;
    const answersJson = body?.answers_json ?? {};
    if (!jobGuideId || !jobPostId) {
      return NextResponse.json({ error: "jobGuideId and jobPostId required" }, { status: 400 });
    }

    const { data: guide } = await auth.supabase
      .from("job_guides")
      .select("id, user_id")
      .eq("id", jobGuideId)
      .eq("user_id", auth.user.id)
      .single();

    if (!guide) return NextResponse.json({ error: "Guide not found" }, { status: 404 });

    const admin = getSupabaseAdmin();
    const { data: jobPost } = await admin
      .from("job_posts")
      .select("id, title, position_text, location_text, source_name, snippet, published_at")
      .eq("id", jobPostId)
      .eq("status", "published")
      .single();

    if (!jobPost) return NextResponse.json({ error: "Job post not found" }, { status: 404 });

    const jobContent = [
      `Başlık: ${jobPost.title ?? ""}`,
      `Pozisyon: ${jobPost.position_text ?? ""}`,
      `Konum: ${jobPost.location_text ?? ""}`,
      `Kaynak: ${jobPost.source_name ?? ""}`,
      `Özet: ${jobPost.snippet ?? ""}`,
    ].join("\n");

    const system = `Sen bir yurtdışı iş başvurusu rehberi asistanısın. Verilen ilan metni ve kullanıcı cevaplarına göre Türkçe, kişiselleştirilmiş bir rapor üret.

Kurallar:
- İlan metninde olmayan bilgi için "İlan metninde belirtilmiyor." yaz.
- Cevaplarda eksik bilgi varsa raporu yine de üret; eksik kısımları belirt.
- Yanıtı SADECE aşağıdaki JSON formatında ver. Başka metin ekleme.
- report_json içindeki her alan Türkçe, net ve madde madde olsun.
- progress_step: Kullanıcının cevaplarına göre 1-7 arası hangi adımda olduğunu tahmin et (1=profil, 2=pasaport, 3=CV, 4=belgeler, 5=sponsor, 6=başvuru, 7=son kontrol).
- next_questions: Kullanıcıya sorulacak 1-3 kısa soru (eksik bilgi veya takip için).

Çıktı formatı (tek JSON objesi):
{
  "report_json": {
    "summary": "...",
    "score": 0-100,
    "top_actions": ["...", "...", "..."],
    "rehber": "...",
    "belgeler": "...",
    "vize_izin": "...",
    "maas_yasam": "...",
    "risk": "...",
    "sana_ozel": "...",
    "plan_30_gun": "..."
  },
  "progress_step": 1,
  "next_questions": ["...", "..."]
}
score: Başvuruya uygunluk skoru (0-100), report_json içinde.`;

    const userPrompt = `İlan metni:\n${jobContent}\n\nKullanıcı cevapları (answers_json):\n${JSON.stringify(answersJson, null, 2)}`;

    const rawText = await callGemini(system, userPrompt);
    const parsed = extractJson(rawText);

    const reportJson = (parsed.report_json as Record<string, unknown>) ?? {};
    const progressStep = typeof parsed.progress_step === "number" ? Math.max(1, Math.min(7, parsed.progress_step)) : 1;
    const nextQuestions = Array.isArray(parsed.next_questions)
      ? parsed.next_questions.filter((q) => typeof q === "string").slice(0, 3)
      : [];

    const score = typeof reportJson.score === "number" ? reportJson.score : null;
    const reportMd = [
      "# 🔒 Bu İlan İçin Başvuru Rehberi\n",
      score != null ? `## 🎯 Uygunluk Skoru: ${score}/100\n` : "",
      `## 📌 Özet\n${String(reportJson.summary ?? "")}\n`,
      `## 🎯 Öncelikli 3 Aksiyon\n${(reportJson.top_actions as string[] ?? []).map((a, i) => `${i + 1}. ${a}`).join("\n")}\n`,
      "## Bu İşe Nasıl Başvurulur?\n" + String(reportJson.rehber ?? ""),
      "\n## Gerekli Belgeler\n" + String(reportJson.belgeler ?? ""),
      "\n## Çalışma İzni ve Vize\n" + String(reportJson.vize_izin ?? ""),
      "\n## Maaş ve Yaşam\n" + String(reportJson.maas_yasam ?? ""),
      "\n## Risk Değerlendirmesi\n" + String(reportJson.risk ?? ""),
      "\n## Sana Özel Analiz\n" + String(reportJson.sana_ozel ?? ""),
      "\n## 30 Günlük Plan\n" + String(reportJson.plan_30_gun ?? ""),
    ].join("\n");

    await auth.supabase
      .from("job_guides")
      .update({
        report_json: reportJson,
        report_md: reportMd,
        progress_step: progressStep,
        status: "in_progress",
      })
      .eq("id", jobGuideId)
      .eq("user_id", auth.user.id);

    await auth.supabase.from("job_guide_events").insert({
      job_guide_id: jobGuideId,
      type: "report_update",
      content: JSON.stringify({ progress_step: progressStep, next_questions: nextQuestions }),
    });

    return NextResponse.json({
      report_json: reportJson,
      report_md: reportMd,
      progress_step: progressStep,
      next_questions: nextQuestions,
    });
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : "unknown_error");
    if (msg.includes("GEMINI_API_KEY_MISSING")) {
      return NextResponse.json({ error: "gemini_not_configured" }, { status: 503 });
    }
    if (msg.includes("Unauthorized")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "internal_error", detail: msg.slice(0, 200) }, { status: 500 });
  }
}
