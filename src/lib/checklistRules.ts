/**
 * Kaynak odaklı checklist: 3 modül (SOURCE_APPLY, ACCOUNT_PROFILE, DOCUMENTS).
 * Sadece kaynak + ilan metninde anlamlı adımlar; ✔ sadece kullanıcı mesajından.
 */

export type Answers = {
  passport?: "var" | "basvurdum" | "yok";
  cv?: "var" | "yok";
  language?: "hic" | "a1" | "a2" | "b1" | "b2";
  profession?: string;
  experience?: "0-1" | "2-4" | "5+";
  barrier?: "yok" | "var";
  // Kaynak adımları – sadece kullanıcı onayı ile done
  has_eu_login?: "var" | "yok";
  has_glassdoor_account?: "var" | "yok";
  source_apply_opened?: "var" | "yok";   // How to apply / Başvuru bölümünü açtım
  source_apply_started?: "var" | "yok";  // Apply adımına geldim / başvuru akışını başlattım
  source_apply_done?: "var" | "yok";     // Başvuruyu tamamladım
  profile_complete?: "var" | "yok";       // Profil bilgilerim tam
  cv_uploaded?: "var" | "yok";          // CV yükledim (ilan istiyorsa)
  has_trade_certificate?: "var" | "yok"; // Ustalık belgesi / mesleki yeterlilik
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

/** Done sadece kullanıcı cevabıyla; ilan metninde yoksa madde yok. 3 modül: Kaynakta Başvuru, Hesap & Profil, CV/Belgeler. */
export function buildChecklist(job: JobForChecklist, answers: Answers): ChecklistModule[] {
  const src = sourceKey(job);
  const modules: ChecklistModule[] = [];

  // 1) SOURCE_APPLY – Kaynakta Başvuru (zorunlu)
  const applyOpened = answers.source_apply_opened === "var";
  const applyStarted = answers.source_apply_started === "var";
  const applyDone = answers.source_apply_done === "var";
  if (src === "eures") {
    modules.push({
      id: "source_apply",
      title: "Kaynakta Başvuru",
      icon: "📋",
      items: [
        { id: "sa1", label: "EURES sayfasında 'How to apply / Başvuru' bölümünü açtım", done: applyOpened },
        { id: "sa2", label: "'Apply / Başvur' adımına geldim", done: applyStarted },
        { id: "sa3", label: "Başvuruyu tamamladım veya başvuru kanalını not aldım", done: applyDone },
      ],
    });
  } else if (src === "glassdoor") {
    modules.push({
      id: "source_apply",
      title: "Kaynakta Başvuru",
      icon: "📋",
      items: [
        { id: "sa1", label: "Glassdoor ilan sayfasına geldim", done: applyOpened },
        { id: "sa2", label: "'Apply / Sign in to apply' ekranını gördüm", done: applyStarted },
        { id: "sa3", label: "Başvuru akışını başlattım", done: applyDone },
      ],
    });
  } else {
    modules.push({
      id: "source_apply",
      title: "Kaynakta Başvuru",
      icon: "📋",
      items: [
        { id: "sa1", label: "İlan sayfasında başvuru bölümünü açtım", done: applyOpened },
        { id: "sa2", label: "Başvuru adımına geldim", done: applyStarted },
        { id: "sa3", label: "Başvuruyu tamamladım veya kanalı not aldım", done: applyDone },
      ],
    });
  }

  // 2) ACCOUNT_PROFILE – Hesap & Profil (kaynağa bağlı)
  const hasEulogin = answers.has_eu_login === "var";
  const hasGlassdoor = answers.has_glassdoor_account === "var";
  const profileOk = answers.profile_complete === "var";
  if (src === "eures") {
    modules.push({
      id: "account_profile",
      title: "Hesap & Profil",
      icon: "👤",
      items: [
        { id: "ap1", label: "EU Login ile giriş yaptım / hesabım var", done: hasEulogin },
        { id: "ap2", label: "Profil bilgilerim (ad, iletişim) tam", done: profileOk },
      ],
    });
  } else if (src === "glassdoor") {
    modules.push({
      id: "account_profile",
      title: "Hesap & Profil",
      icon: "👤",
      items: [
        { id: "ap1", label: "Glassdoor hesabı açtım / giriş yaptım", done: hasGlassdoor },
        { id: "ap2", label: "Profil bilgilerim tam", done: profileOk },
      ],
    });
  } else {
    modules.push({
      id: "account_profile",
      title: "Hesap & Profil",
      icon: "👤",
      items: [
        { id: "ap1", label: "Platform hesabım var / giriş yaptım", done: hasEulogin || hasGlassdoor || profileOk },
        { id: "ap2", label: "Profil bilgilerim tam", done: profileOk },
      ],
    });
  }

  // 3) BELGELER & NİTELİK – CV + ustalık belgesi (✔ sadece kullanıcı cevabıyla)
  const cvDone = answers.cv === "var" || answers.cv_uploaded === "var";
  const tradeCertDone = answers.has_trade_certificate === "var";
  modules.push({
    id: "documents",
    title: "Belgeler & Nitelik",
    icon: "📄",
    items: [
      { id: "d1", label: "CV hazır (PDF)", done: cvDone },
      { id: "d2", label: "Ustalık belgesi / mesleki yeterlilik (varsa)", done: tradeCertDone },
      { id: "d3", label: "İlanda istenen ek belge(ler) hazır (ilan metninde belirtiliyorsa)", done: false },
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

/** Kaynak modülündeki ilk yapılmamış adımlar – "Bugün bitirmen gereken" için (kaynak odaklı). */
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
    source_apply_started: asVarYok(normalizeEnum(json.source_apply_started)),
    source_apply_done: asVarYok(normalizeEnum(json.source_apply_done)),
    profile_complete: asVarYok(normalizeEnum(json.profile_complete)),
    cv_uploaded: asVarYok(normalizeEnum(json.cv_uploaded)),
    has_trade_certificate: asVarYok(normalizeEnum(json.has_trade_certificate)),
  };
}
