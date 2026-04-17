import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseForUser } from "@/lib/supabase/server";
import { validateIndividualBillingPayload } from "@/lib/billingIndividual";
import { buildPremiumCouponArchivePricing, ODEME_BASKET_WEEKLY } from "@/lib/odemePaytrPendingPricing";
import { insertBillingIndividualCouponCompleted } from "@/lib/billingIndividualRecord";

const ALLOWED = new Set(["ADMIN89", "99TLDENEME", "ICMERKEZI14"]);

/** Haftalık premium kupon (apply-coupon) sonrası fatura arşivi. */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const supabaseUser = getSupabaseForUser(token);
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user?.id || !user.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = (await req.json()) as { individual_billing?: unknown; coupon_code?: string };
    const code = (body.coupon_code ?? "").trim().toUpperCase();
    if (!ALLOWED.has(code)) {
      return NextResponse.json({ success: false, error: "Geçersiz kupon." }, { status: 400 });
    }
    const v = validateIndividualBillingPayload(body.individual_billing ?? null, {
      paytrEmail: user.email,
      skipPaytrEmailMatch: false,
    });
    if (!v.ok) {
      return NextResponse.json({ success: false, error: v.error }, { status: 400 });
    }
    const expected = buildPremiumCouponArchivePricing(code);
    const b = v.data;
    if (b.service_name !== ODEME_BASKET_WEEKLY) {
      return NextResponse.json({ success: false, error: "Hizmet adı uyuşmuyor." }, { status: 400 });
    }
    if (
      Math.abs(Number(b.pricing.net_amount) - expected.netAmount) > 0.009 ||
      Math.abs(Number(b.pricing.gross_amount) - expected.grossAmount) > 0.009 ||
      Math.abs(Number(b.pricing.discount_amount) - expected.discountAmount) > 0.009
    ) {
      return NextResponse.json({ success: false, error: "Tutar özeti uyuşmuyor." }, { status: 400 });
    }
    if ((b.pricing.coupon_code ?? "").trim().toUpperCase() !== code) {
      return NextResponse.json({ success: false, error: "Kupon kodu özeti uyuşmuyor." }, { status: 400 });
    }
    const admin = getSupabaseAdmin();
    const paymentIdKey = `coupon_premium:${user.id}:${code}:${Date.now()}`;
    const ins = await insertBillingIndividualCouponCompleted(admin, {
      userId: user.id,
      orderId: null,
      paymentIdKey,
      billing: b,
      couponCode: code,
      source: "premium_apply_coupon",
    });
    if (ins.error) {
      return NextResponse.json({ success: false, error: ins.error }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[billing/after-premium-coupon]", e);
    return NextResponse.json({ success: false, error: "İşlem başarısız" }, { status: 500 });
  }
}
