import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ProfileStatus =
  | "draft"
  | "completed"
  | "checkout_started"
  | "paid"
  | "failed"
  | "processing"
  | "delivered";

export type WizardMethod = "voice" | "chat" | "form";

export interface ProfileDraftState {
  profileId: string | null;
  method: WizardMethod | null;
  status: ProfileStatus;
  answers: Record<string, unknown>;
  country: string;
  jobArea: string;
  jobBranch: string;
  photoUrl: string | null;
  completed: boolean;
  // actions
  setMethod: (m: WizardMethod | null) => void;
  setAnswers: (a: Record<string, unknown>) => void;
  setCountry: (c: string) => void;
  setJobArea: (a: string) => void;
  setJobBranch: (b: string) => void;
  setPhotoUrl: (url: string | null) => void;
  setCompleted: (v: boolean) => void;
  setProfileId: (id: string | null) => void;
  setStatus: (s: ProfileStatus) => void;
  reset: (method?: WizardMethod) => void;
}

const initial = (method: WizardMethod | null = null) => ({
  profileId: null,
  method,
  status: "draft" as ProfileStatus,
  answers: {},
  country: "",
  jobArea: "",
  jobBranch: "",
  photoUrl: null,
  completed: false,
});

export const useProfileDraftStore = create<ProfileDraftState>()(
  persist(
    (set) => ({
      ...initial(null),
      setMethod: (method) => set((s) => ({ ...s, method, ...(method ? {} : initial(null)) })),
      setAnswers: (answers) => set((s) => ({ ...s, answers })),
      setCountry: (country) => set((s) => ({ ...s, country })),
      setJobArea: (jobArea) => set((s) => ({ ...s, jobArea })),
      setJobBranch: (jobBranch) => set((s) => ({ ...s, jobBranch })),
      setPhotoUrl: (photoUrl) => set((s) => ({ ...s, photoUrl })),
      setCompleted: (completed) => set((s) => ({ ...s, completed })),
      setProfileId: (profileId) => set((s) => ({ ...s, profileId })),
      setStatus: (status) => set((s) => ({ ...s, status })),
      reset: (method) => set(initial(method ?? null)),
    }),
    {
      name: "ilanlar-profile-draft",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profileId: s.profileId,
        method: s.method,
        status: s.status,
        answers: s.answers,
        country: s.country,
        jobArea: s.jobArea,
        jobBranch: s.jobBranch,
        photoUrl: s.photoUrl,
        completed: s.completed,
      }),
    }
  )
);
