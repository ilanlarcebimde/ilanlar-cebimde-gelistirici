import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateIndividualBillingPayload } from "@/lib/billingIndividual";
import { buildAdmin549FreePricing } from "@/lib/odemePaytrPendingPricing";
import { insertBillingIndividualCouponCompleted } from "@/lib/billingIndividualRecord";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ADMIN549 sonrası — profil oluştuktan hemen sonra fatura arşivi (PayTR yok). */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      profile_id?: string;
      individual_billing?: unknown;
    };
    const profileId = typeof body.profile_id === "string" ? body.profile_id.trim() : "";
    if (!profileId || !UUID_REGEX.test(profileId)) {
      return NextResponse.json({ success: false, error: "Geçersiz profil." }, { status: 400 });
    }
    const v = validateIndividualBillingPayload(body.individual_billing ?? null, {
      paytrEmail: null,
      skipPaytrEmailMatch: true,
    });
    if (!v.ok) {
      return NextResponse.json({ success: false, error: v.error }, { status: 400 });
    }
    const expected = buildAdmin549FreePricing();
    const b = v.data;
    if (b.service_name !== expected.serviceName) {
      return NextResponse.json({ success: false, error: "Hizmet adı uyuşmuyor." }, { status: 400 });
    }
    if (
      Math.abs(Number(b.pricing.net_amount) - expected.netAmount) > 0.009 ||
      Math.abs(Number(b.pricing.gross_amount) - expected.grossAmount) > 0.009 ||
      Math.abs(Number(b.pricing.discount_amount) - expected.discountAmount) > 0.009
    ) {
      return NextResponse.json({ success: false, error: "Tutar özeti uyuşmuyor." }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("id, created_at, status")
      .eq("id", profileId)
      .maybeSingle();
    if (profErr || !prof?.id) {
      return NextResponse.json({ success: false, error: "Profil bulunamadı." }, { status: 404 });
    }
    if (prof.status !== "paid") {
      return NextResponse.json({ success: false, error: "Profil durumu uygun değil." }, { status: 400 });
    }
    const createdMs = new Date(prof.created_at as string).getTime();
    if (!Number.isFinite(createdMs) || Date.now() - createdMs > 20 * 60 * 1000) {
      return NextResponse.json({ success: false, error: "İşlem süresi aşıldı. Destek ile iletişime geçin." }, { status: 400 });
    }
    const paymentIdKey = `coupon_profile:${profileId}`;
    const ins = await insertBillingIndividualCouponCompleted(supabase, {
      userId: null,
      orderId: null,
      paymentIdKey,
      billing: b,
      couponCode: "ADMIN549",
      source: "free_profile_coupon",
      profileId,
    });
    if (ins.error) {
      return NextResponse.json({ success: false, error: ins.error }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[billing/after-free-profile-coupon]", e);
    return NextResponse.json({ success: false, error: "İşlem başarısız" }, { status: 500 });
  }
}
