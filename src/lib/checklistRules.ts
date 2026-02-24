/**
 * Minimal checklist: 3 modül (Platform/Hesap, Başvuru Adımı, CV). Toplam 5–6 madde.
 * İlerleme = "bu başvuru akışındaki kritik adımlar"; ✔ sadece kullanıcı cevabıyla.
 */

export type Answers = {
  passport?: "var" | "basvurdum" | "yok";
  cv?: "var" | "yok";
  language?: "hic" | "a1" | "a2" | "b1" | "b2";
  profession?: string;
  experience?: "0-1" | "2-4" | "5+";
  barrier?: "yok" | "var";
  has_eu_login?: "var" | "yok";
  has_glassdoor_account?: "var" | "yok";
  source_apply_opened?: "var" | "yok";   // İlana gittim / sayfayı açtım
  source_apply_found?: "var" | "yok";    // Apply / How to apply bölümünü gördüm
  source_apply_started?: "var" | "yok";  // Başvuruyu başlattım / form açıldı
  source_apply_done?: "var" | "yok";
  profile_complete?: "var" | "yok";
  cv_uploaded?: "var" | "yok";
  has_trade_certificate?: "var" | "yok"; // Rapor/akışta; ilerlemeye dahil değil
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

function sourceKey(job: JobForChecklist): "eures" | "glassdoor" | "linkedin" | "default" {
  const name = (job?.source_name ?? "").toLowerCase();
  if (name.includes("eures")) return "eures";
  if (name.includes("glassdoor")) return "glassdoor";
  if (name.includes("linkedin")) return "linkedin";
  return "default";
}

/** 3 modül: Platform/Hesap (1), Başvuru Adımı (3), CV (2). Toplam 6 madde. */
export function buildChecklist(job: JobForChecklist, answers: Answers): ChecklistModule[] {
  const src = sourceKey(job);
  const modules: ChecklistModule[] = [];

  const hasEulogin = answers.has_eu_login === "var";
  const hasGlassdoor = answers.has_glassdoor_account === "var";
  const applyOpened = answers.source_apply_opened === "var";
  const applyFound = answers.source_apply_found === "var";
  const applyStarted = answers.source_apply_started === "var";
  const cvReady = answers.cv === "var";
  const cvUploaded = answers.cv_uploaded === "var";

  // 1) Platform / Hesap — 1 madde (kaynağa göre)
  if (src === "eures") {
    modules.push({
      id: "platform",
      title: "Platform / Hesap",
      icon: "👤",
      items: [{ id: "p1", label: "EURES’te EU Login hesabım var / giriş yaptım", done: hasEulogin }],
    });
  } else if (src === "glassdoor") {
    modules.push({
      id: "platform",
      title: "Platform / Hesap",
      icon: "👤",
      items: [{ id: "p1", label: "Glassdoor hesabım var / giriş yaptım", done: hasGlassdoor }],
    });
  } else {
    modules.push({
      id: "platform",
      title: "Platform / Hesap",
      icon: "👤",
      items: [{ id: "p1", label: "Bu platformda hesabım var / giriş yaptım", done: hasEulogin || hasGlassdoor }],
    });
  }

  // 2) Başvuru Adımı — 3 madde
  modules.push({
    id: "apply",
    title: "Başvuru Adımı",
    icon: "📋",
    items: [
      { id: "a1", label: "İlana gittim / sayfayı açtım", done: applyOpened },
      { id: "a2", label: "Apply / How to apply bölümünü gördüm", done: applyFound },
      { id: "a3", label: "Başvuruyu başlattım / form açıldı", done: applyStarted },
    ],
  });

  // 3) CV — 2 madde (ilerleme sadece bunlarla)
  modules.push({
    id: "cv",
    title: "CV",
    icon: "📄",
    items: [
      { id: "c1", label: "CV hazır (PDF)", done: cvReady },
      { id: "c2", label: "CV’yi başvuruya ekledim / yükledim", done: cvUploaded },
    ],
  });

  return modules;
}

export function calcProgress(modules: ChecklistModule[]): { total: number; done: number; pct: number } {
  const total = modules.reduce((sum, m) => sum + m.items.length, 0);
  const done = modules.reduce((sum, m) => sum + m.items.filter((i) => i.done).length, 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

/** Eksik adımlar (sırayla) — Hızlı Özet / sonraki adım için. */
export function getMissingTop(modules: ChecklistModule[], n: number): string[] {
  const labels: string[] = [];
  for (const m of modules) {
    for (const it of m.items) {
      if (!it.done && labels.length < n) labels.push(it.label);
    }
  }
  return labels.slice(0, n);
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
function asVarYok(v: unknown): "var" | "yok" | undefined {
  if (v === "var" || v === "yok") return v;
  return undefined;
}

export function answersFromJson(json: Record<string, unknown>): Answers {
  return {
    passport: asPassport(normalizeEnum(json.passport)),
    cv: asCv(normalizeEnum(json.cv)),
    language: asLang(json.language),
    profession: typeof json.profession === "string" ? json.profession.trim() || undefined : undefined,
    experience: asExp(json.experience),
    barrier: asBarrier(normalizeEnum(json.barrier)),
    has_eu_login: asVarYok(normalizeEnum(json.has_eu_login)),
    has_glassdoor_account: asVarYok(normalizeEnum(json.has_glassdoor_account)),
    source_apply_opened: asVarYok(normalizeEnum(json.source_apply_opened)),
    source_apply_found: asVarYok(normalizeEnum(json.source_apply_found)),
    source_apply_started: asVarYok(normalizeEnum(json.source_apply_started)),
    source_apply_done: asVarYok(normalizeEnum(json.source_apply_done)),
    profile_complete: asVarYok(normalizeEnum(json.profile_complete)),
    cv_uploaded: asVarYok(normalizeEnum(json.cv_uploaded)),
    has_trade_certificate: asVarYok(normalizeEnum(json.has_trade_certificate)),
  };
}
