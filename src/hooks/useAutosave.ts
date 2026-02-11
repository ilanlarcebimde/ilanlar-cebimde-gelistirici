"use client";

import { useEffect, useRef, useCallback } from "react";
import { saveProfileDraft } from "@/lib/profileSave";
import { logEvent } from "@/lib/profileSave";
import type { ProfileStatus } from "@/store/profileDraftStore";

const DEBOUNCE_MS = 1000;

export interface DraftSnapshot {
  profileId: string | null;
  method: "voice" | "chat" | "form" | null;
  status: ProfileStatus;
  answers: Record<string, unknown>;
  country: string;
  job_area: string;
  job_branch: string;
  photo_url: string | null;
}

export function useAutosave(
  snapshot: DraftSnapshot,
  onProfileId?: (id: string) => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const save = useCallback(async (): Promise<string | null> => {
    const payload = {
      id: snapshot.profileId ?? undefined,
      method: snapshot.method ?? "form",
      status: snapshot.status,
      country: snapshot.country || null,
      job_area: snapshot.job_area || null,
      job_branch: snapshot.job_branch || null,
      answers: snapshot.answers,
      photo_url: snapshot.photo_url || null,
    };
    const key = JSON.stringify(payload);
    if (key === lastSavedRef.current) return snapshot.profileId ?? null;
    const id = await saveProfileDraft(payload);
    if (id) {
      lastSavedRef.current = key;
      if (id !== snapshot.profileId) onProfileId?.(id);
      await logEvent("answer_saved", id, { answers: snapshot.answers });
      return id;
    }
    return null;
  }, [snapshot, onProfileId]);

  const saveNow = useCallback(async (): Promise<string | null> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return save();
  }, [save]);

  useEffect(() => {
    if (!snapshot.method) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      save();
      timerRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    snapshot.answers,
    snapshot.country,
    snapshot.job_area,
    snapshot.job_branch,
    snapshot.photo_url,
    save,
    snapshot.method,
    snapshot.profileId,
  ]);

  return { saveNow };
}
