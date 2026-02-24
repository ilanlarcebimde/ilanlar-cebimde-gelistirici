/**
 * Final rapor üretimi (tüm sorular bittiğinde).
 * /api/job-guide/update ve chat route (nextStep === null) tarafından kullanılır.
 */

import { callGeminiJson, extractJsonStrict } from "@/lib/ai/gemini";

const REPORT_SYSTEM = `Sen, "yurtdışı iş başvuru asistanı"sın. Analizi bu ilan + kullanıcı cevaplarından üret. 7 tema zorunlu:
1) Adım adım başvuru rehberi (how_to_apply)
2) Gerekli belgeler listesi (documents)
3) Çalışma izni ve vize süreci (work_permit_and_visa)
4) Net maaş ve yaşam gider hesabı (salary_and_life_calc)
5) Risk değerlendirmesi (risk_assessment)
6) Sana özel uygunluk analizi (fit_analysis)
7) 7 günlük başvuru planı (plan_7_days)

user_answers içinde consultancy_pasaport, consultancy_cv, consultancy_belgeler varsa bunları ilgili bölümlere (work_permit_and_visa, documents vb.) mutlaka dahil et; ara turlarda verilen eksik tamamlama stratejileri raporda yer alsın.
Kısa, net, madde madde. Uydurma yok. İlan metninde yoksa "İlan metninde belirtilmiyor" de.

Girdi: job_post, user_answers, checklist_snapshot. ÇIKTI: SADECE JSON.

JSON ŞEMASI (zorunlu):
{
  "summary": { "one_liner": "string", "top_actions": ["string","string","string"] },
  "how_to_apply": { "steps": ["string"], "where_to_apply": "string", "notes": ["string"] },
  "documents": { "required": ["string"], "optional": ["string"], "warnings": ["string"], "eksik_tamamlama": "string" },
  "work_permit_and_visa": { "sponsor_needed": "yes|no|unknown", "process_owner": "employer|candidate|unknown", "estimated_duration": "string", "risk_points": ["string"], "eksik_tamamlama": "string" },
  "salary_and_life_calc": { "currency": "string", "net_salary_estimate": "string", "rent_estimate": "string", "remaining_estimate": "string", "assumptions": ["string"] },
  "risk_assessment": { "level": "low|medium|high", "items": [ { "title": "string", "why": "string", "what_to_do": "string" } ] },
  "fit_analysis": { "score": 0, "strengths": ["string"], "gaps": ["string"] },
  "plan_30_days": { "week1": ["string"], "week2": ["string"], "week3": ["string"], "week4": ["string"] },
  "plan_7_days": { "days": ["string"] }
}
- score 0-100 integer. plan_7_days: ilk 7 gün için günlük adımlar (days: ["Gün 1: ...", "Gün 2: ..."]). Pasaport "yok" ise top_actions 1. madde pasaport randevusu.
- Emoji JSON içine koyma.`;

export type GenerateReportResult = {
  reportJson: Record<string, unknown>;
  reportMd: string;
  score: number | null;
  riskLevel: string | null;
};

export async function generateFinalReport(
  jobContent: string,
  answersJson: Record<string, unknown>,
  checklistSnapshot: Record<string, unknown>
): Promise<GenerateReportResult> {
  const consultancyBlock = [
    answersJson.consultancy_pasaport ? `consultancy_pasaport (ara turda verilen strateji):\n${String(answersJson.consultancy_pasaport)}` : "",
    answersJson.consultancy_cv ? `consultancy_cv (ara turda verilen strateji):\n${String(answersJson.consultancy_cv)}` : "",
    answersJson.consultancy_belgeler ? `consultancy_belgeler (ara turda verilen strateji):\n${String(answersJson.consultancy_belgeler)}` : "",
  ].filter(Boolean).join("\n\n");
  const userPrompt = `job_post:\n${jobContent}\n\nuser_answers:\n${JSON.stringify(answersJson, null, 2)}\n\nchecklist_snapshot:\n${JSON.stringify(checklistSnapshot, null, 2)}${consultancyBlock ? `\n\n---\nEksik tamamlama stratejileri (yukarıdaki user_answers'tan; ilgili bölümlere dahil et):\n${consultancyBlock}` : ""}`;

  const rawText = await callGeminiJson({
    system: REPORT_SYSTEM,
    user: userPrompt,
    temperature: 0.3,
    maxOutputTokens: 4096,
    timeoutMs: 45000,
  });

  const parsed = extractJsonStrict<{
    summary?: { one_liner?: string; top_actions?: string[] };
    how_to_apply?: { steps?: string[]; where_to_apply?: string; notes?: string[] };
    documents?: { required?: string[]; optional?: string[]; warnings?: string[]; eksik_tamamlama?: string };
    work_permit_and_visa?: Record<string, unknown> & { eksik_tamamlama?: string };
    salary_and_life_calc?: Record<string, unknown>;
    risk_assessment?: { level?: string; items?: Array<{ title?: string; why?: string; what_to_do?: string }> };
    fit_analysis?: { score?: number; strengths?: string[]; gaps?: string[] };
    plan_30_days?: { week1?: string[]; week2?: string[]; week3?: string[]; week4?: string[] };
    plan_7_days?: { days?: string[] };
  }>(rawText);

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
  const vizeText = typeof visa === "object" ? JSON.stringify(visa, null, 2) : String(visa);
  const salary = parsed.salary_and_life_calc ?? {};
  const maasText =
    typeof salary === "object"
      ? [salary.net_salary_estimate, salary.rent_estimate, salary.food_estimate, salary.remaining_estimate]
          .filter(Boolean)
          .join(" · ")
      : String(salary);
  const risk = parsed.risk_assessment ?? {};
  const riskText = Array.isArray(risk.items)
    ? risk.items.map((i) => `${i.title ?? ""}: ${i.why ?? ""} ${i.what_to_do ?? ""}`).join("\n")
    : String(risk.level ?? "");
  const fit = parsed.fit_analysis ?? {};
  const score = typeof fit.score === "number" ? Math.max(0, Math.min(100, fit.score)) : null;
  const riskLevel =
    parsed.risk_assessment?.level === "low" ||
    parsed.risk_assessment?.level === "medium" ||
    parsed.risk_assessment?.level === "high"
      ? parsed.risk_assessment.level
      : null;
  const plan = parsed.plan_30_days ?? {};
  const planText = [
    Array.isArray(plan.week1) ? "Hafta 1: " + plan.week1.join("; ") : "",
    Array.isArray(plan.week2) ? "Hafta 2: " + plan.week2.join("; ") : "",
    Array.isArray(plan.week3) ? "Hafta 3: " + plan.week3.join("; ") : "",
    Array.isArray(plan.week4) ? "Hafta 4: " + plan.week4.join("; ") : "",
  ].filter(Boolean).join("\n");

  const plan7 = parsed.plan_7_days?.days;
  const plan7Text = Array.isArray(plan7) && plan7.length > 0
    ? plan7.map((d, i) => `Gün ${i + 1}: ${d}`).join("\n")
    : (Array.isArray(plan.week1) ? plan.week1.slice(0, 7).map((s, i) => `Gün ${i + 1}: ${s}`).join("\n") : "");

  const reportJson: Record<string, unknown> = {
    schema_version: 2,
    summary: summaryObj.one_liner ?? "",
    top_actions: topActions,
    rehber: rehberText,
    belgeler: belgelerText,
    vize_izin: vizeText,
    maas_yasam: maasText,
    risk: riskText,
    sana_ozel: [...(fit.strengths ?? []), ...(fit.gaps ?? [])].join("\n"),
    plan_30_gun: planText,
    plan_7_gun: plan7Text,
    score: score ?? undefined,
    _raw: parsed,
  };

  const reportMd = [
    "# Bu İlan İçin Nasıl Başvururum\n",
    score != null ? `## Uygunluk Skoru: ${score}/100\n` : "",
    `## Özet\n${String(reportJson.summary ?? "")}\n`,
    `## Öncelikli 3 Aksiyon\n${topActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n`,
    "## 1. Adım adım başvuru rehberi\n" + rehberText,
    "\n## 2. Gerekli Belgeler\n" + belgelerText,
    "\n## 3. Çalışma İzni ve Vize\n" + vizeText,
    "\n## 4. Maaş ve Yaşam\n" + maasText,
    "\n## 5. Risk Değerlendirmesi\n" + riskText,
    "\n## 6. Sana Özel Analiz\n" + String(reportJson.sana_ozel ?? ""),
    "\n## 7. 7 Günlük Başvuru Planı\n" + plan7Text,
    "\n## 30 Günlük Plan\n" + planText,
  ].join("\n");

  return { reportJson, reportMd, score, riskLevel };
}
