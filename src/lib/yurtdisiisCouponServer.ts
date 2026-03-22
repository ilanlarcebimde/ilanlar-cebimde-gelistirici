import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  isYurtdisiisCouponExpired,
  isYurtdisiisCouponCode,
  normalizeTrCouponCode,
  YURTDISIIS_COUPON_CODE,
} from "@/lib/yurtdisiisCoupon";

/**
 * Kupon daha önce başarılı ödeme ile kullanılmış mı? (e-posta veya kullanıcı bazında tek kullanım)
 */
export async function verifyYurtdisiisCanUse(
  email: string,
  userId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isYurtdisiisCouponExpired()) {
    return { ok: false, error: "Bu kuponun süresi dolmuştur." };
  }
  const emailLower = email.trim().toLowerCase();
  if (!emailLower) {
    return { ok: false, error: "E-posta gerekli." };
  }

  const supabase = getSupabaseAdmin();
  const codeDb = normalizeTrCouponCode(YURTDISIIS_COUPON_CODE);

  const { data: payments, error } = await supabase
    .from("payments")
    .select("provider_ref, user_id")
    .eq("coupon_code", codeDb)
    .eq("status", "success");

  if (error) {
    console.error("[yurtdisiis] payments query", error);
    return { ok: false, error: "Kupon kontrolü yapılamadı." };
  }

  for (const p of payments ?? []) {
    if (userId && p.user_id && p.user_id === userId) {
      return { ok: false, error: "Bu kupon bu hesap ile daha önce kullanıldı." };
    }
  }

  const refs = (payments ?? []).map((p) => p.provider_ref).filter(Boolean) as string[];
  if (refs.length === 0) return { ok: true };

  const { data: orders, error: ordersError } = await supabase
    .from("cv_orders")
    .select("email, user_id, merchant_oid")
    .in("merchant_oid", refs);

  if (ordersError) {
    console.error("[yurtdisiis] cv_orders query", ordersError);
    return { ok: false, error: "Kupon kontrolü yapılamadı." };
  }

  for (const o of orders ?? []) {
    const oEmail = (o.email ?? "").trim().toLowerCase();
    if (oEmail && oEmail === emailLower) {
      return { ok: false, error: "Bu kupon bu e-posta adresi ile daha önce kullanıldı." };
    }
    if (userId && o.user_id && o.user_id === userId) {
      return { ok: false, error: "Bu kupon bu hesap ile daha önce kullanıldı." };
    }
  }

  return { ok: true };
}

export { isYurtdisiisCouponCode };
