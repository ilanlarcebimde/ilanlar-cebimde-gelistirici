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
  if (answers.service_one_week_plan === "Evet") out.push("1 haftalık başvuru planı");
  return out;
}

/** Şu an netleşen 3 madde: cevaplanan alanlara göre kısa özet. */
function getNetlesenler(answers: Record<string, unknown>, source: JobSource): string[] {
  const items: string[] = [];
  if (answers.found_apply_section) {
    items.push(`Başvuru bölümü: ${answers.found_apply_section}`);
  }
  if (answers.has_passport) {
    items.push(`Pasaport: ${answers.has_passport}`);
  }
  if (answers.cv_ready) {
    items.push(`CV: ${answers.cv_ready}`);
  }
  if (answers.language_level) {
    items.push(`Dil seviyesi: ${answers.language_level}`);
  }
  if (source === "eures" && answers.apply_method) {
    items.push(`Başvuru yöntemi: ${answers.apply_method}`);
  }
  if (items.length === 0) {
    items.push("Seçtiğin hizmetlere göre adım adım ilerliyoruz.");
  }
  return items.slice(0, 3);
}

/** Chat mesajı: greeting_shown ise selam yok; direkt şu anki durum + yapılacaklar. */
export function buildDeterministicGuide(
  job: { source_name?: string | null; location_text?: string | null },
  answers: Record<string, unknown>,
  nextStep: FlowStep | null,
  source: JobSource
): string {
  const sourceName = (job.source_name ?? "").toLowerCase();
  const isEures = sourceName.includes("eures") || source === "eures";
  const steps = isEures ? EURES_STEPS : GLASSDOOR_STEPS;
  const selected = getSelectedServicesList(answers);
  const netlesenler = getNetlesenler(answers, source);
  const greetingAlreadyShown = answers.greeting_shown === true;

  const lines: string[] = [];
  if (!greetingAlreadyShown) {
    const intro = isEures
      ? "Merhaba efendim. Bu ilan kaynağı EURES. EURES üzerinden başvuru için ilandaki **How to apply / Apply** bölümünden ilerlenir."
      : "Merhaba efendim. Bu ilan kaynağı Glassdoor. Başvuru çoğu ilanda **Apply / Sign in to apply** alanından yapılır.";
    lines.push(intro);
  } else {
    lines.push("**Şu anki durum:**");
    if (selected.length > 0) {
      lines.push(`Seçtiğin konular: ${selected.join(", ")}.`);
    }
    lines.push(...netlesenler.map((n) => "• " + n));
    if (lines.length <= 1) lines.push("Seçtiğin hizmetlere göre adım adım ilerliyoruz.");
  }

  lines.push("");
  lines.push("**Şimdi yapman gereken:**");
  steps.forEach((s) => lines.push(`✅ ${s}`));
  lines.push("");
  lines.push("**Şu an netleşenler:**");
  netlesenler.forEach((n) => lines.push(`• ${n}`));

  return lines.join("\n").trim();
}

/** Bootstrap mesajı (1 kez): selam + kaynak + 3–5 madde EURES/Glassdoor başvuru + kapanış. Sonraki turlarda selam yok (greeting_shown). */
export function getBootstrapMessage(source: JobSource): string {
  const isEures = source === "eures";
  const kaynak = isEures ? "EURES" : "GLASSDOOR";
  const steps = isEures ? EURES_STEPS : GLASSDOOR_STEPS;
  const lines: string[] = [
    "Merhaba efendim. Bu ilan kaynağı: " + kaynak + ". Şimdi başvuru sürecini hızlıca netleştireceğim.",
    "",
    "**" + kaynak + "’da başvuru nasıl yapılır:**",
    ...steps.map((s) => "✅ " + s),
    "",
    "Şimdi birkaç kritik bilgiyi netleştirip seni doğru adıma yönlendireceğim. Aşağıdan hangi konularda yardım istediğini seç.",
  ];
  return lines.join("\n").trim();
}
