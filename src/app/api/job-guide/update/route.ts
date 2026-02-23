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

/** Kanal slug veya location_text'ten ülke çıkar (Gemini prompt için). */
function inferCountry(channelSlug: string | null, locationText: string): string {
  const slug = (channelSlug ?? "").toLowerCase();
  const loc = locationText.toLowerCase();
  const bySlug: Record<string, string> = {
    katar: "Katar",
    belcika: "Belçika",
    irlanda: "İrlanda",
    almanya: "Almanya",
    hollanda: "Hollanda",
    avusturya: "Avusturya",
    polonya: "Polonya",
    isvec: "İsveç",
    norvec: "Norveç",
    finlandiya: "Finlandiya",
    danimarka: "Danimarka",
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

    let body: {
      jobGuideId?: string;
      jobPostId?: string;
      answers_json?: Record<string, unknown>;
      checklist_snapshot?: { total?: number; done?: number; percent?: number; missing_top5?: string[] };
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const jobGuideId = body?.jobGuideId;
    const jobPostId = body?.jobPostId;
    const answersJson = body?.answers_json ?? {};
    const checklistSnapshot = body?.checklist_snapshot ?? {};
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

    const { data: currentRow } = await auth.supabase
      .from("job_guides")
      .select("id, status")
      .eq("id", jobGuideId)
      .eq("user_id", auth.user.id)
      .single();

    if (currentRow?.status === "report_generating") {
      return NextResponse.json({ error: "Analiz zaten güncelleniyor, lütfen bekleyin." }, { status: 409 });
    }

    await auth.supabase
      .from("job_guides")
      .update({ status: "report_generating" })
      .eq("id", jobGuideId)
      .eq("user_id", auth.user.id);

    const unlock = () =>
      auth.supabase
        .from("job_guides")
        .update({ status: currentRow?.status ?? "draft" })
        .eq("id", jobGuideId)
        .eq("user_id", auth.user.id);

    try {
      const admin = getSupabaseAdmin();
    const { data: jobPostRow } = await admin
      .from("job_posts")
      .select("id, title, position_text, location_text, source_name, snippet, published_at, channels(slug)")
      .eq("id", jobPostId)
      .eq("status", "published")
      .single();

    if (!jobPostRow) {
      await unlock();
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    const jobPost = jobPostRow as Record<string, unknown> & { location_text?: string | null };
    const ch = (jobPost as { channels?: { slug?: string } | Array<{ slug?: string }> | null }).channels;
    const channelSlug =
      ch == null ? null : Array.isArray(ch) ? ch[0]?.slug ?? null : ch?.slug ?? null;
    const country = inferCountry(channelSlug, jobPost.location_text ?? "");

    const jobContent = [
      `İlan başlığı: ${jobPost.title ?? ""}`,
      `Sektör/Pozisyon: ${jobPost.position_text ?? ""}`,
      `Konum: ${jobPost.location_text ?? ""}`,
      `Ülke: ${country}`,
      `İlan kaynağı (başvuru adımları buna göre üretilecek): ${jobPost.source_name ?? "belirtilmedi"}`,
      `Özet: ${jobPost.snippet ?? ""}`,
    ].join("\n");

    const system = `Sen, "yurtdışı iş başvuru asistanı"sın. Analizi SADECE bu ilandaki verilerden üret: ülke, iş ilanı başlığı, sektör (pozisyon), konum, ilan kaynağı ve kullanıcı cevapları. "Nasıl başvururum" = bu ilana özel (ülke + başlık + sektör ile) adım adım rehber; dış URL'ye yönlendirme yapma.
Kullanıcının eğitim seviyesi düşük olabilir. Kısa, net, madde madde yaz. Uzun paragraf yazma.
Uydurma bilgi yazma. İlan verisinde olmayan şeylere "İlan metninde belirtilmiyor" de.

Girdi: job_post (ilan başlığı, sektör/pozisyon, konum, ülke, kaynak, özet), user_answers, checklist_snapshot.

ÇIKTI: SADECE JSON DÖNDÜR. Başka hiçbir metin yazma.

JSON ŞEMASI (zorunlu):
{
  "summary": { "one_liner": "string", "top_actions": ["string","string","string"] },
  "how_to_apply": { "steps": ["string","string","string","string","string"], "where_to_apply": "string", "cv_language": "string", "notes": ["string","string"] },
  "documents": { "required": ["string","string","string"], "optional": ["string","string"], "warnings": ["string"] },
  "work_permit_and_visa": { "sponsor_needed": "yes|no|unknown", "process_owner": "employer|candidate|unknown", "estimated_duration": "string", "risk_points": ["string","string"] },
  "salary_and_life_calc": { "currency": "string", "net_salary_estimate": "string", "rent_estimate": "string", "food_estimate": "string", "transport_estimate": "string", "remaining_estimate": "string", "assumptions": ["string","string"] },
  "risk_assessment": { "level": "low|medium|high", "items": [ { "title": "string", "level": "low|medium|high", "why": "string", "what_to_do": "string" } ] },
  "fit_analysis": { "score": 0, "strengths": ["string","string"], "gaps": ["string","string"], "next_questions": ["string","string","string"] },
  "plan_30_days": { "week1": ["string","string","string"], "week2": ["string","string","string"], "week3": ["string","string","string"], "week4": ["string","string","string"] }
}

Kurallar:
- how_to_apply.steps: Bu ilanın ülkesi, başlığı ve kaynağına göre (EURES, şirket portalı vb.) gerçek başvuru adımlarını numaralı yaz. Link verme; "X sitesine gir, Y bölümüne tıkla" gibi net adımlar yaz.
- where_to_apply: İlan kaynağına göre nereye başvurulacağını kısaca yaz (site/platform adı, "İlan metninde belirtilmiyor" vb.).
- score 0-100 arası integer (fit_analysis.score). Pasaport "yok" ise top_actions 1. madde pasaport randevusu olsun.
- Dil seviyesi "hic/a1/a2" ise risk_assessment içinde "Dil riski" olsun.
- Maaş/kira için kesin rakam uydurma; aralık veya "tahmini" kullan. Emoji JSON içine koyma.`;

    const userPrompt = `job_post:\n${jobContent}\n\nuser_answers:\n${JSON.stringify(answersJson, null, 2)}\n\nchecklist_snapshot:\n${JSON.stringify(checklistSnapshot, null, 2)}`;

    const rawText = await callGemini(system, userPrompt);
    const parsed = extractJson(rawText) as {
      summary?: { one_liner?: string; top_actions?: string[] };
      how_to_apply?: { steps?: string[]; where_to_apply?: string; cv_language?: string; notes?: string[] };
      documents?: { required?: string[]; optional?: string[]; warnings?: string[] };
      work_permit_and_visa?: Record<string, unknown>;
      salary_and_life_calc?: Record<string, unknown>;
      risk_assessment?: { level?: string; items?: Array<{ title?: string; level?: string; why?: string; what_to_do?: string }> };
      fit_analysis?: { score?: number; strengths?: string[]; gaps?: string[]; next_questions?: string[] };
      plan_30_days?: { week1?: string[]; week2?: string[]; week3?: string[]; week4?: string[] };
    };

    const summaryObj = parsed.summary ?? {};
    const topActions = Array.isArray(summaryObj.top_actions) ? summaryObj.top_actions : [];
    const howTo = parsed.how_to_apply ?? {};
    const rehberText = Array.isArray(howTo.steps) ? howTo.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") : "";
    const docs = parsed.documents ?? {};
    const belgelerText = [
      Array.isArray(docs.required) ? "Gerekli: " + docs.required.join(", ") : "",
      Array.isArray(docs.optional) ? "Opsiyonel: " + docs.optional.join(", ") : "",
      Array.isArray(docs.warnings) ? "Uyarılar: " + docs.warnings.join("; ") : "",
    ].filter(Boolean).join("\n");
    const visa = parsed.work_permit_and_visa ?? {};
    const vizeText = typeof visa === "object" ? JSON.stringify(visa, null, 2).replace(/\n/g, "\n") : String(visa);
    const salary = parsed.salary_and_life_calc ?? {};
    const maasText = typeof salary === "object" ? [salary.net_salary_estimate, salary.rent_estimate, salary.food_estimate, salary.remaining_estimate].filter(Boolean).join(" · ") : String(salary);
    const risk = parsed.risk_assessment ?? {};
    const riskText = Array.isArray(risk.items) ? risk.items.map((i: { title?: string; why?: string; what_to_do?: string }) => `${i.title ?? ""}: ${i.why ?? ""} ${i.what_to_do ?? ""}`).join("\n") : String(risk.level ?? "");
    const fit = parsed.fit_analysis ?? {};
    const nextQuestions = Array.isArray(fit.next_questions) ? fit.next_questions.filter((q): q is string => typeof q === "string").slice(0, 3) : [];
    const score = typeof fit.score === "number" ? Math.max(0, Math.min(100, fit.score)) : null;
    const riskLevel = (parsed.risk_assessment?.level === "low" || parsed.risk_assessment?.level === "medium" || parsed.risk_assessment?.level === "high") ? parsed.risk_assessment.level : null;
    const plan = parsed.plan_30_days ?? {};
    const planText = [
      Array.isArray(plan.week1) ? "Hafta 1: " + plan.week1.join("; ") : "",
      Array.isArray(plan.week2) ? "Hafta 2: " + plan.week2.join("; ") : "",
      Array.isArray(plan.week3) ? "Hafta 3: " + plan.week3.join("; ") : "",
      Array.isArray(plan.week4) ? "Hafta 4: " + plan.week4.join("; ") : "",
    ].filter(Boolean).join("\n");
    const progressStep = typeof fit.score === "number" ? Math.min(7, Math.max(1, Math.floor((fit.score / 100) * 7))) : 1;

    const reportJson: Record<string, unknown> = {
      schema_version: 1,
      summary: summaryObj.one_liner ?? "",
      top_actions: topActions,
      rehber: rehberText,
      belgeler: belgelerText,
      vize_izin: vizeText,
      maas_yasam: maasText,
      risk: riskText,
      sana_ozel: [...(fit.strengths ?? []), ...(fit.gaps ?? [])].join("\n"),
      plan_30_gun: planText,
      score: score ?? undefined,
      _raw: parsed,
    };

    const reportMd = [
      "# Bu İlan İçin Nasıl Başvururum\n",
      score != null ? `## Uygunluk Skoru: ${score}/100\n` : "",
      `## Özet\n${String(reportJson.summary ?? "")}\n`,
      `## Öncelikli 3 Aksiyon\n${topActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n`,
      "## Bu İşe Nasıl Başvurulur?\n" + rehberText,
      "\n## Gerekli Belgeler\n" + belgelerText,
      "\n## Çalışma İzni ve Vize\n" + vizeText,
      "\n## Maaş ve Yaşam\n" + maasText,
      "\n## Risk Değerlendirmesi\n" + riskText,
      "\n## Sana Özel Analiz\n" + String(reportJson.sana_ozel ?? ""),
      "\n## 30 Günlük Plan\n" + planText,
    ].join("\n");

    const updatePayload: Record<string, unknown> = {
      report_json: reportJson,
      report_md: reportMd,
      progress_step: progressStep,
      status: "in_progress", // lock kaldır
    };
    if (score != null) updatePayload.score = score;
    if (riskLevel) updatePayload.risk_level = riskLevel;

    await auth.supabase
      .from("job_guides")
      .update(updatePayload)
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
        score: score ?? undefined,
        risk_level: riskLevel ?? undefined,
      });
    } catch (inner) {
      await unlock();
      throw inner;
    }
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : "unknown_error");
    if (msg.includes("GEMINI_API_KEY_MISSING")) {
      return NextResponse.json({ error: "gemini_not_configured" }, { status: 503 });
    }
    if (msg.includes("Unauthorized")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "internal_error", detail: msg.slice(0, 200) }, { status: 500 });
  }
}
