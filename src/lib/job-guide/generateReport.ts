/**
 * Final rapor üretimi (tüm sorular bittiğinde).
 * /api/job-guide/update ve chat route (nextStep === null) tarafından kullanılır.
 */

import { callGeminiJson, extractJsonStrict } from "@/lib/ai/gemini";

const REPORT_SYSTEM = `Sen, "yurtdışı iş başvuru asistanı"sın. Analizi SADECE bu ilandaki verilerden üret: ülke, iş ilanı başlığı, sektör (pozisyon), konum, ilan kaynağı ve kullanıcı cevapları. "Nasıl başvururum" = bu ilana özel (ülke + başlık + sektör ile) adım adım rehber; dış URL'ye yönlendirme yapma.
Kullanıcının eğitim seviyesi düşük olabilir. Kısa, net, madde madde yaz. Uzun paragraf yazma.
Uydurma bilgi yazma. İlan verisinde olmayan şeylere "İlan metninde belirtilmiyor" de.

Girdi: job_post, user_answers, checklist_snapshot. ÇIKTI: SADECE JSON.

JSON ŞEMASI (zorunlu):
{
  "summary": { "one_liner": "string", "top_actions": ["string","string","string"] },
  "how_to_apply": { "steps": ["string"], "where_to_apply": "string", "notes": ["string"] },
  "documents": { "required": ["string"], "optional": ["string"], "warnings": ["string"] },
  "work_permit_and_visa": { "sponsor_needed": "yes|no|unknown", "process_owner": "employer|candidate|unknown", "estimated_duration": "string", "risk_points": ["string"] },
  "salary_and_life_calc": { "currency": "string", "net_salary_estimate": "string", "rent_estimate": "string", "remaining_estimate": "string", "assumptions": ["string"] },
  "risk_assessment": { "level": "low|medium|high", "items": [ { "title": "string", "why": "string", "what_to_do": "string" } ] },
  "fit_analysis": { "score": 0, "strengths": ["string"], "gaps": ["string"] },
  "plan_30_days": { "week1": ["string"], "week2": ["string"], "week3": ["string"], "week4": ["string"] }
}
- score 0-100 integer. Pasaport "yok" ise top_actions 1. madde pasaport randevusu.
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
  const userPrompt = `job_post:\n${jobContent}\n\nuser_answers:\n${JSON.stringify(answersJson, null, 2)}\n\nchecklist_snapshot:\n${JSON.stringify(checklistSnapshot, null, 2)}`;

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
    documents?: { required?: string[]; optional?: string[]; warnings?: string[] };
    work_permit_and_visa?: Record<string, unknown>;
    salary_and_life_calc?: Record<string, unknown>;
    risk_assessment?: { level?: string; items?: Array<{ title?: string; why?: string; what_to_do?: string }> };
    fit_analysis?: { score?: number; strengths?: string[]; gaps?: string[] };
    plan_30_days?: { week1?: string[]; week2?: string[]; week3?: string[]; week4?: string[] };
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

  return { reportJson, reportMd, score, riskLevel };
}
