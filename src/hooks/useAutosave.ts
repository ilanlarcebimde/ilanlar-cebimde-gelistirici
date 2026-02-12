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
  onProfileId?: (id: string) => void,
  options?: { serverSaveDisabled?: boolean }
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const disabled = options?.serverSaveDisabled === true;

  const buildPayload = useCallback((s: DraftSnapshot) => ({
    id: s.profileId ?? undefined,
    method: s.method ?? "form",
    status: s.status,
    country: (s.country ?? "").trim() || null,
    job_area: (s.job_area ?? "").trim() || null,
    job_branch: (s.job_branch ?? "").trim() || null,
    answers: s.answers && typeof s.answers === "object" ? s.answers : {},
    photo_url: s.photo_url || null,
  }), []);

  const save = useCallback(async (override?: Partial<DraftSnapshot>): Promise<string | null> => {
    if (disabled) return null;
    const s = override ? { ...snapshot, ...override } : snapshot;
    const payload = buildPayload(s);
    const key = JSON.stringify(payload);
    if (key === lastSavedRef.current) return s.profileId ?? null;
    const id = await saveProfileDraft(payload);
    if (id) {
      lastSavedRef.current = key;
      if (id !== s.profileId) onProfileId?.(id);
      await logEvent("answer_saved", id, { answers: payload.answers });
      return id;
    }
    return null;
  }, [snapshot, onProfileId, disabled, buildPayload]);

  const saveNow = useCallback(async (override?: Partial<DraftSnapshot>): Promise<string | null> => {
    if (disabled) return null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return save(override);
  }, [save, disabled]);

  useEffect(() => {
    if (disabled || !snapshot.method) return;
    // İlk kayıtta boş row oluşturma: profileId yoksa ve hiç veri yoksa bekle
    const hasData =
      (snapshot.country ?? "").trim() !== "" ||
      (snapshot.job_branch ?? "").trim() !== "" ||
      (snapshot.photo_url ?? "").trim() !== "" ||
      (snapshot.answers && typeof snapshot.answers === "object" && Object.keys(snapshot.answers).length > 0);
    if (!snapshot.profileId && !hasData) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      save();
      timerRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    disabled,
    snapshot.answers,
    snapshot.country,
    snapshot.job_area,
    snapshot.job_branch,
    snapshot.photo_url,
    snapshot.profileId,
    save,
    snapshot.method,
  ]);

  return { saveNow };
}
