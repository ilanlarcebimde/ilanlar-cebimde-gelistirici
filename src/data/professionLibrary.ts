/**
 * Meslek dalına göre beceri ve görev önerileri.
 * job_area + job_branch seçilince skills/tasks yüklenir; yoksa fallback kullanılır.
 * profiles.answers içine yazılır; CV üretiminde kullanılır.
 */

import library from "./professionLibrary.json";

type BranchEntry = {
  branchKey: string;
  branchLabel: string;
  skills: string[];
  tasks: string[];
  skillRules: { minSelect: number; maxSelect: number; defaultSelect: string[] };
  taskRules: { minSelect: number; maxSelect: number; defaultSelect: string[] };
};

type AreaEntry = {
  areaKey: string;
  areaLabel: string;
  branches: BranchEntry[];
};

type LibraryShape = {
  version: string;
  fallback: { genericSkills: string[]; genericTasks: string[] };
  areas: AreaEntry[];
};

const lib = library as LibraryShape;

/** Uygulama job_area id → kütüphane areaKey (aynı kalabilir veya eşleştir) */
const AREA_ID_TO_KEY: Record<string, string> = {
  insaat: "insaat",
  elektrik: "elektrik",
  metal: "metal",
  motorlu: "motorlu",
  seramik: "seramik",
  konaklama: "konaklama",
  yiyecek: "yiyecek",
  tekstil: "tekstil",
  ahsap: "ahsap",
  makine: "makine",
  boya: "boya",
  tesisat: "tesisat",
};

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[ıi]/g, "i")
    .replace(/[şs]/g, "s")
    .replace(/[ğg]/g, "g")
    .replace(/[üu]/g, "u")
    .replace(/[öo]/g, "o")
    .replace(/[çc]/g, "c")
    .trim();
}

function findBranch(areaId: string, branchName: string): BranchEntry | null {
  const areaKey = AREA_ID_TO_KEY[areaId] ?? areaId;
  const area = lib.areas.find((a) => a.areaKey === areaKey);
  if (!area) return null;
  const normalizedBranch = normalizeForMatch(branchName);
  const found = area.branches.find(
    (b) => normalizeForMatch(b.branchLabel) === normalizedBranch
  );
  if (found) return found;
  return area.branches.find((b) =>
    normalizeForMatch(b.branchLabel).includes(normalizedBranch)
  ) ?? null;
}

export interface SkillsResult {
  skills: string[];
  skillRules: { minSelect: number; maxSelect: number; defaultSelect: string[] };
  fromFallback: boolean;
}

export interface TasksResult {
  tasks: string[];
  taskRules: { minSelect: number; maxSelect: number; defaultSelect: string[] };
  fromFallback: boolean;
}

/** Meslek dalına göre beceri listesi ve kurallar. Branch yoksa fallback. */
export function getSkillsForBranch(areaId: string, branchName: string): SkillsResult {
  const branch = findBranch(areaId, branchName);
  if (branch) {
    return {
      skills: branch.skills,
      skillRules: branch.skillRules,
      fromFallback: false,
    };
  }
  return {
    skills: lib.fallback.genericSkills,
    skillRules: { minSelect: 3, maxSelect: 12, defaultSelect: lib.fallback.genericSkills.slice(0, 6) },
    fromFallback: true,
  };
}

/** Meslek dalına göre görev listesi ve kurallar. Branch yoksa fallback. */
export function getTasksForBranch(areaId: string, branchName: string): TasksResult {
  const branch = findBranch(areaId, branchName);
  if (branch) {
    return {
      tasks: branch.tasks,
      taskRules: branch.taskRules,
      fromFallback: false,
    };
  }
  return {
    tasks: lib.fallback.genericTasks,
    taskRules: { minSelect: 2, maxSelect: 6, defaultSelect: lib.fallback.genericTasks.slice(0, 3) },
    fromFallback: true,
  };
}

/** Branch bulunursa tam veri; yoksa null (fallback ayrı çağrılır). */
export function getLibraryBranch(areaId: string, branchName: string): BranchEntry | null {
  return findBranch(areaId, branchName);
}

export const PROFESSION_LIBRARY_FALLBACK = lib.fallback;
