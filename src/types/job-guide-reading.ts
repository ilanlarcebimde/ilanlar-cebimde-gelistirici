/**
 * Rehber okuma modu modalı için yapılandırılmış JSON şeması.
 * API (örn. Gemini) bu formatta dönecek; UI modal bu veriyle render edilir.
 */

export type GuideMeta = {
  title: string;
  location?: string;
  country?: string;
  source_name?: string;
  source_url?: string;
};

export type ApplyGuideModule = {
  summary: string;
  steps: string[];
  details_md?: string;
};

export type DocumentsModule = {
  required: string[];
  optional: string[];
  notes?: string[];
};

export type WorkPermitVisaModule = {
  summary: string;
  steps: string[];
  official_sources?: string[];
  note_if_no_official?: string;
};

export type SalaryLifeCalcModule = {
  summary: string;
  assumptions?: string[];
  ranges?: Array<{ label: string; range: string }>;
  note_if_unknown?: string;
};

export type RiskItem = {
  title: string;
  why: string;
  what_to_do: string;
};

export type RiskAssessmentModule = {
  level: string;
  items: RiskItem[];
};

export type FitAnalysisModule = {
  score0_100?: number;
  strengths: string[];
  gaps: string[];
  next_actions: string[];
};

export type OneWeekPlanModule = {
  days: Record<string, string[]>;
};

export type GuideModules = {
  apply_guide?: ApplyGuideModule;
  documents?: DocumentsModule;
  work_permit_visa?: WorkPermitVisaModule;
  salary_life_calc?: SalaryLifeCalcModule;
  risk_assessment?: RiskAssessmentModule;
  fit_analysis?: FitAnalysisModule;
  one_week_plan?: OneWeekPlanModule;
};

export type GuideReadingJson = {
  meta: GuideMeta;
  modules: GuideModules;
};
