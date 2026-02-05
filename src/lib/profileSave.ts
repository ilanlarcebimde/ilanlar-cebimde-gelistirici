import { supabase } from "./supabase";
import type { Profile, EventType } from "./supabase";

export async function saveProfileDraft(profile: Partial<Profile>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const row = {
    ...profile,
    user_id: user?.id ?? null,
    updated_at: new Date().toISOString(),
  };
  if (profile.id) {
    const { error } = await supabase.from("profiles").update(row).eq("id", profile.id);
    if (error) {
      console.warn("Profile update error", error);
      return null;
    }
    return profile.id;
  }
  const { data, error } = await supabase.from("profiles").insert(row).select("id").single();
  if (error) {
    console.warn("Profile insert error", error);
    return null;
  }
  return data?.id ?? null;
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
