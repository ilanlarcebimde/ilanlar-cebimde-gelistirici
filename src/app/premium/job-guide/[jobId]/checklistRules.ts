/**
 * Deterministik canlı checklist (AI'siz).
 * answers'a göre anlık güncellenir.
 */

export type Answers = {
  passport?: "var" | "basvurdum" | "yok";
  cv?: "var" | "yok";
  language?: "hic" | "a1" | "a2" | "b1" | "b2";
  profession?: string;
  experience?: "0-1" | "2-4" | "5+";
  barrier?: "yok" | "var";
};

export type ChecklistItem = { id: string; label: string; done: boolean; hint?: string };
export type ChecklistModule = { id: string; title: string; icon: string; items: ChecklistItem[] };

export type JobForChecklist = {
  id: string;
  title: string | null;
  location_text?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  snippet?: string | null;
} | null;

export function buildChecklist(job: JobForChecklist, answers: Answers): ChecklistModule[] {
  const passportDone = answers.passport === "var";
  const passportInProgress = answers.passport === "basvurdum";
  const cvDone = answers.cv === "var";
  const langOk = answers.language === "b1" || answers.language === "b2";

  const modules: ChecklistModule[] = [
    {
      id: "passport",
      title: "Pasaport & Kimlik",
      icon: "🛂",
      items: [
        { id: "p1", label: "Pasaport var", done: passportDone, hint: passportInProgress ? "Başvurduysan takip et" : "Yoksa ilk adım pasaport" },
        { id: "p2", label: "Süre yeterli (en az 6 ay)", done: passportDone },
        { id: "p3", label: "En az 2 boş sayfa", done: passportDone },
        { id: "p4", label: "Biyometrik foto hazır", done: passportDone || passportInProgress },
        { id: "p5", label: "Nüfus kaydı / kimlik hazır", done: passportDone || passportInProgress },
      ],
    },
    {
      id: "cv",
      title: "CV & Belgeler",
      icon: "📄",
      items: [
        { id: "c1", label: "CV hazır", done: cvDone },
        { id: "c2", label: "CV dili uygun", done: cvDone },
        { id: "c3", label: "Deneyim maddeleri net", done: cvDone },
        { id: "c4", label: "Referans eklendi", done: cvDone },
        { id: "c5", label: "Sertifika eklendi (varsa)", done: false },
        { id: "c6", label: "Sabıka kaydı planlandı", done: false },
      ],
    },
    {
      id: "visa",
      title: "Vize & Çalışma İzni",
      icon: "🌍",
      items: [
        { id: "v1", label: "Sponsor gerekliliği kontrol edildi", done: false },
        { id: "v2", label: "İşveren başvurusu netleşti", done: false },
        { id: "v3", label: "Ortalama süre biliniyor", done: false },
        { id: "v4", label: "Randevu / takip planı hazır", done: false },
      ],
    },
    {
      id: "salary",
      title: "Maaş & Yaşam Hesabı",
      icon: "💰",
      items: [
        { id: "s1", label: "Net maaş hesaplandı", done: false },
        { id: "s2", label: "Kira tahmini", done: false },
        { id: "s3", label: "Gıda tahmini", done: false },
        { id: "s4", label: "Ulaşım tahmini", done: false },
        { id: "s5", label: "Aylık kalan hesaplandı", done: false },
      ],
    },
    {
      id: "risk",
      title: "Risk Değerlendirmesi",
      icon: "⚠️",
      items: [
        { id: "r1", label: "Dolandırıcılık kontrolü", done: false },
        { id: "r2", label: "Dil riski değerlendirildi", done: false },
        { id: "r3", label: "Sponsor riski değerlendirildi", done: false },
        { id: "r4", label: "Fiziksel iş riski not edildi", done: false },
      ],
    },
    {
      id: "fit",
      title: "Sana Uygunluk",
      icon: "🎯",
      items: [
        { id: "f1", label: "Meslek uyumu", done: !!answers.profession },
        { id: "f2", label: "Deneyim uyumu", done: !!answers.experience },
        { id: "f3", label: "Dil uyumu", done: !!answers.language },
      ],
    },
    {
      id: "plan",
      title: "30 Gün Yol Haritası",
      icon: "🗓",
      items: [
        { id: "pl1", label: "1. Hafta: CV tamamla", done: cvDone },
        { id: "pl2", label: "1. Hafta: Pasaport kontrol", done: passportDone || passportInProgress },
        { id: "pl3", label: "2. Hafta: 10 ilana başvur", done: false },
        { id: "pl4", label: "2. Hafta: Referans topla", done: false },
        { id: "pl5", label: "3. Hafta: Sertifikaları hazırla", done: false },
        { id: "pl6", label: "3. Hafta: Sponsorlu ilanları filtrele", done: false },
        { id: "pl7", label: "4. Hafta: Görüşme hazırlığı", done: false },
      ],
    },
  ];

  return modules;
}

export function calcProgress(modules: ChecklistModule[]): { total: number; done: number; pct: number } {
  const total = modules.reduce((sum, m) => sum + m.items.length, 0);
  const done = modules.reduce((sum, m) => sum + m.items.filter((i) => i.done).length, 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

/** Checklist'ten yapılmamış maddeleri önem sırasına göre (pasaport → cv → vize → …) alır; ilk n tanesinin label'ını döner. missing_top5 / "3 kritik adım" için kullan. */
export function getMissingTop(modules: ChecklistModule[], n: number): string[] {
  const labels: string[] = [];
  for (const m of modules) {
    for (const it of m.items) {
      if (!it.done && labels.length < n) labels.push(it.label);
    }
  }
  return labels.slice(0, n);
}

/** answers_json'dan Answers çıkar (chat'ten gelen "Var"/"Yok" gibi değerleri normalize eder) */
export function answersFromJson(json: Record<string, unknown>): Answers {
  return {
    passport: asPassport(normalizeEnum(json.passport)),
    cv: asCv(normalizeEnum(json.cv)),
    language: asLang(json.language),
    profession: typeof json.profession === "string" ? json.profession.trim() || undefined : undefined,
    experience: asExp(json.experience),
    barrier: asBarrier(normalizeEnum(json.barrier)),
  };
}

function normalizeEnum(v: unknown): unknown {
  if (typeof v === "string") return v.toLowerCase().trim();
  return v;
}

function asPassport(v: unknown): Answers["passport"] {
  if (v === "var" || v === "basvurdum" || v === "yok") return v;
  return undefined;
}
function asCv(v: unknown): Answers["cv"] {
  if (v === "var" || v === "yok") return v;
  return undefined;
}
function asLang(v: unknown): Answers["language"] {
  if (v === "hic" || v === "a1" || v === "a2" || v === "b1" || v === "b2") return v;
  return undefined;
}
function asExp(v: unknown): Answers["experience"] {
  if (v === "0-1" || v === "2-4" || v === "5+") return v;
  return undefined;
}
function asBarrier(v: unknown): Answers["barrier"] {
  if (v === "yok" || v === "var") return v;
  return undefined;
}
