import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Haftalık premium: sadece ends_at > now() olan kayıt geçerli.
 * Ödeme yapmamış veya süresi dolmuş kullanıcı false döner.
 */
export async function isPremiumSubscriptionActive(userId: string): Promise<boolean> {
  if (!userId) return false;
  const nowIso = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("premium_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .gt("ends_at", nowIso)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[premiumSubscription] query error", error.message, { userId });
    return false;
  }
  return !!data;
}

/**
 * Premium Plus: hem ends_at > now() hem tier = 'plus' olan kayıt gerekli.
 * Cover letter sihirbazı gibi özellikler sadece Plus abonelerine açıktır.
 */
export async function isPremiumPlusSubscriptionActive(userId: string): Promise<boolean> {
  if (!userId) return false;
  const nowIso = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("premium_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("tier", "plus")
    .gt("ends_at", nowIso)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[premiumSubscription] plus query error", error.message, { userId });
    return false;
  }
  return !!data;
}
