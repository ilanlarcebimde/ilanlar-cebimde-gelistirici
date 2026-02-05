export type WizardMethod = "voice" | "chat" | "form";

export interface WizardAnswers {
  [key: string]: string | string[] | undefined;
}

export interface WizardState {
  method: WizardMethod;
  step: number;
  totalSteps?: number;
  answers: WizardAnswers;
  country: string;
  jobArea: string;
  jobBranch: string;
  photoUrl: string | null;
  photoFile?: File | null;
}

export const DEFAULT_WIZARD_STATE: WizardState = {
  method: "form",
  step: 0,
  answers: {},
  country: "",
  jobArea: "",
  jobBranch: "",
  photoUrl: null,
  photoFile: null,
};
