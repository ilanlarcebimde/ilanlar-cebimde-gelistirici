import { supabase } from "./supabase";
import type { Profile, EventType } from "./supabase";
import { safeParseJsonResponse } from "./safeJsonResponse";

export async function saveProfileDraft(profile: Partial<Profile>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const body = {
    id: profile.id ?? undefined,
    user_id: user?.id ?? null,
    method: profile.method ?? "form",
    status: profile.status ?? "draft",
    country: profile.country ?? null,
    job_area: profile.job_area ?? null,
    job_branch: profile.job_branch ?? null,
    answers: profile.answers ?? {},
    photo_url: profile.photo_url ?? null,
  };
  const res = await fetch("/api/profile/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  try {
    const data = await safeParseJsonResponse<{ id?: string }>(res, { logPrefix: "[profile/draft]" });
    return data?.id ?? null;
  } catch (e) {
    console.warn("Profile draft save failed", res.status, e);
    return null;
  }
}

export async function logEvent(
  type: EventType,
  profileId?: string,
  payload?: Record<string, unknown>
) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("events").insert({
    user_id: user?.id ?? null,
    profile_id: profileId ?? null,
    type,
    payload: payload ?? {},
  });
}
