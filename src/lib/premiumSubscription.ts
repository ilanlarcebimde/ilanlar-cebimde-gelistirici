import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isVipPreviewActive } from "@/lib/vipPreviewAccess";

/**
 * Haftalık premium: sadece ends_at > now() olan kayıt geçerli.
 * Ödeme yapmamış veya süresi dolmuş kullanıcı false döner.
 * `userEmail`: geçici VIP önizleme hesabı için isteğe bağlı.
 */
export async function isPremiumSubscriptionActive(userId: string, userEmail?: string | null): Promise<boolean> {
  if (!userId) return false;
  if (isVipPreviewActive(userEmail)) return true;
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
 * Premium abonelik (tier ayrımı yok; haftalık 99 TL = tek Premium).
 * Cover letter ve diğer premium özellikler aynı abonelikle açıktır.
 */
export async function isPremiumPlusSubscriptionActive(userId: string, userEmail?: string | null): Promise<boolean> {
  return isPremiumSubscriptionActive(userId, userEmail);
}
