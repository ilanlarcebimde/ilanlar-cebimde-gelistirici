"use client";

import { useProfileDraftStore } from "@/store/profileDraftStore";

export function useProfileDraft() {
  return useProfileDraftStore();
}
