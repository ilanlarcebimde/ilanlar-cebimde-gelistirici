/**
 * SERVICES_GATE: Deterministik rehber metni. LLM'ye bırakmadan EURES/Glassdoor şablonu + seçili hizmetler + "Şu an netleşenler".
 * 4–6 madde, tekrar yok.
 */

import type { FlowStep } from "@/data/jobGuideConfig";

type JobSource = "eures" | "glassdoor" | "default";

const EURES_STEPS = [
  "1. İlanda **How to apply / Apply** bölümünü bul.",
  "2. jobsireland.ie veya ilanın verdiği başvuru linkine tıkla.",
  "3. Gerekirse **Login / Register** ile giriş yap.",
  "4. **Apply** butonu veya e-posta talimatına göre başvur.",
];

const GLASSDOOR_STEPS = [
  "1. Glassdoor’da **profil oluştur** veya giriş yap.",
  "2. **Jobs** sekmesinden ilanı aç.",
  "3. **Easy Apply** varsa oradan; yoksa **Company site** ile şirket sitesine git.",
  "4. Formu doldurup **Submit** et.",
];

function getSelectedServicesList(answers: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (answers.service_apply_guide === "Evet") out.push("Adım adım başvuru rehberi");
  if (answers.service_documents === "Evet") out.push("Gerekli belgeler listesi");
  if (answers.service_work_permit_visa === "Evet") out.push("Çalışma izni ve vize süreci");
  if (answers.service_salary_life_calc === "Evet") out.push("Net maaş ve yaşam gider hesabı");
  if (answers.service_risk_assessment === "Evet") out.push("Risk değerlendirmesi");
  if (answers.service_fit_analysis === "Evet") out.push("Sana özel uygunluk analizi");
  if (answers.service_one_week_plan === "Evet") out.push("7 günlük başvuru planı");
  return out;
}

/** Sadece service_* ve greeting_shown / services_selected sayılmaz; gerçek cevaplar varsa genel rehber gösterilmez. */
const ONLY_SERVICE_KEYS = new Set([
  "greeting_shown", "services_selected",
  "service_apply_guide", "service_documents", "service_work_permit_visa",
  "service_salary_life_calc", "service_risk_assessment", "service_fit_analysis", "service_one_week_plan",
]);

function hasMeaningfulAnswers(answers: Record<string, unknown>): boolean {
  return Object.keys(answers).some((k) => !ONLY_SERVICE_KEYS.has(k));
}

/** answerKey → kullanıcıya gösterilecek kısa etiket (Şu an netleşenler için). */
const ANSWER_LABELS: Record<string, string> = {
  found_apply_section: "Başvuru bölümü",
  apply_method: "Başvuru yöntemi",
  needs_eu_login: "EU Login gereksinimi",
  apply_section_location: "Apply konumu",
  has_glassdoor_account: "Glassdoor hesabı",
  redirects_to_company_site: "Şirket sitesine yönlendirme",
  has_passport: "Pasaport",
  is_eu_eea_citizen: "AB/AEA vatandaşlığı",
  cv_ready: "CV",
  proof_docs: "Mesleki kanıtlar",
  language_level: "Dil seviyesi",
  blocking_issue: "Engel",
  blocking_issue_text: "Engel detayı",
};

/** mergedAnswers'tan dinamik "Şu an netleşenler" listesi (Sağır asistan çözümü). */
function getNetlesenler(answers: Record<string, unknown>, _source: JobSource): string[] {
  const items: string[] = [];
  const selected = getSelectedServicesList(answers);
  if (selected.length > 0) {
    items.push(`Seçilen konular: ${selected.join(", ")}`);
  }
  for (const [key, label] of Object.entries(ANSWER_LABELS)) {
    const v = answers[key];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (v.length > 0) items.push(`${label}: ${(v as string[]).join(", ")}`);
    } else {
      const s = String(v).trim();
      if (s) items.push(`${label}: ${s}`);
    }
  }
  if (items.length === 0) {
    items.push("Kritik bilgileri topluyoruz; her cevap sonrası yapılacaklar netleşecek.");
  }
  return items;
}

/**
 * Chat mesajı. Bozuk plak: genel 4 adımlık rehber SADECE ilk turda (henüz anlamlı cevap yok).
 * 2. ve sonraki turlarda: empatik onay (confirmationLine) + Şu an netleşenler (dinamik).
 */
export function buildDeterministicGuide(
  job: { source_name?: string | null; location_text?: string | null },
  answers: Record<string, unknown>,
  nextStep: FlowStep | null,
  source: JobSource,
  confirmationLine?: string | null
): string {
  const sourceName = (job.source_name ?? "").toLowerCase();
  const isEures = sourceName.includes("eures") || source === "eures";
  const steps = isEures ? EURES_STEPS : GLASSDOOR_STEPS;
  const netlesenler = getNetlesenler(answers, source);
  const greetingAlreadyShown = answers.greeting_shown === true;
  const showGeneralGuide = !hasMeaningfulAnswers(answers);

  const lines: string[] = [];
  if (!greetingAlreadyShown) {
    const intro = isEures
      ? "Merhaba efendim. Bu ilan kaynağı EURES. EURES üzerinden başvuru için ilandaki **How to apply / Apply** bölümünden ilerlenir."
      : "Merhaba efendim. Bu ilan kaynağı Glassdoor. Başvuru çoğu ilanda **Apply / Sign in to apply** alanından yapılır.";
    lines.push(intro);
  } else if (confirmationLine) {
    lines.push(confirmationLine);
  } else {
    lines.push("**Şu anki durum:**");
    lines.push(...netlesenler.map((n) => "• " + n));
  }

  lines.push("");
  if (showGeneralGuide) {
    lines.push("**Şimdi yapman gereken:**");
    steps.forEach((s) => lines.push(`✅ ${s}`));
    lines.push("");
  }
  lines.push("**Şu an netleşenler:**");
  netlesenler.forEach((n) => lines.push(`• ${n}`));

  return lines.join("\n").trim();
}

/** Bootstrap (1 kez): kısa selam + kaynak + Hızlı Rehber panelde. Sorular config'ten. */
export function getBootstrapMessage(source: JobSource): string {
  const isEures = source === "eures";
  const kaynak = isEures ? "EURES" : "GLASSDOOR";
  const steps = isEures ? EURES_STEPS : GLASSDOOR_STEPS;
  const lines: string[] = [
    "Merhaba efendim. Bu ilan kaynağı: " + kaynak + ".",
    "",
    "**Hızlı Rehber** sol panelde; kaynağa göre başvuru adımları orada.",
    "",
    "**" + kaynak + "’da başvuru nasıl yapılır:**",
    ...steps.map((s) => "✅ " + s),
  ];
  return lines.join("\n").trim();
}
