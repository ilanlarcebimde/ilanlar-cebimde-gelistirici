import { NextRequest, NextResponse } from "next/server";
import { getPaytrToken } from "@/lib/paytr";
import { PAYMENTS_PAUSED } from "@/lib/paymentsPaused";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  AMOUNT_YURTDISIIS_DISCOUNTED,
  isYurtdisiisCouponCode,
  normalizeTrCouponCode,
} from "@/lib/yurtdisiisCoupon";
import { verifyYurtdisiisCanUse } from "@/lib/yurtdisiisCouponServer";
import { LETTER_PANEL_AMOUNT_TRY, LETTER_PANEL_BASKET, LETTER_PANEL_PAYMENT_TYPE } from "@/lib/letterPanelUnlock";
import { assertBillingMatchesPaytrInitiate, validateIndividualBillingPayload } from "@/lib/billingIndividual";
import { insertBillingIndividualPaytrPending } from "@/lib/billingIndividualRecord";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

export async function POST(request: NextRequest) {
  if (PAYMENTS_PAUSED) {
    return NextResponse.json(
      { success: false, error: "payments_paused" },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const {
      merchant_oid,
      email,
      amount,
      user_name,
      user_address,
      user_phone,
      merchant_ok_url,
      merchant_fail_url,
      basket_description,
      profile_snapshot,
      user_id: body_user_id,
      cv_order_id,
      payment_type,
      coupon_code,
      individual_billing,
    } = body as {
      merchant_oid?: string;
      email?: string;
      amount?: number;
      user_name?: string;
      user_address?: string;
      user_phone?: string;
      merchant_ok_url?: string;
      merchant_fail_url?: string;
      basket_description?: string;
      profile_snapshot?: {
        method?: string;
        country?: string | null;
        job_area?: string | null;
        job_branch?: string | null;
        answers?: Record<string, unknown>;
        photo_url?: string | null;
      };
      user_id?: string;
      cv_order_id?: string;
      payment_type?: string;
      coupon_code?: string;
      individual_billing?: unknown;
    };

    const emailTrimmed = typeof email === "string" ? email.trim() : "";
    const userId = typeof body_user_id === "string" && body_user_id.trim() ? body_user_id.trim() : null;
    const paymentTypeRaw = typeof payment_type === "string" ? payment_type.trim() : "";

    if (!merchant_oid || !emailTrimmed || amount == null || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "merchant_oid, email ve amount (0'dan büyük) zorunludur." },
        { status: 400 }
      );
    }

    const billingValidated = validateIndividualBillingPayload(individual_billing ?? null, {
      paytrEmail: emailTrimmed,
    });
    if (!billingValidated.ok) {
      return NextResponse.json({ success: false, error: billingValidated.error }, { status: 400 });
    }
    const basketForCheck = typeof basket_description === "string" ? basket_description.trim() : "";
    const match = assertBillingMatchesPaytrInitiate(billingValidated.data, {
      amount: Number(amount),
      basket_description: basketForCheck,
    });
    if (!match.ok) {
      return NextResponse.json({ success: false, error: match.error }, { status: 400 });
    }

    /** İş başvuru mektubu paneli — tek seferlik 79 TL; haftalık premium ile karışmaz */
    if (paymentTypeRaw === LETTER_PANEL_PAYMENT_TYPE) {
      if (Number(amount) !== LETTER_PANEL_AMOUNT_TRY) {
        return NextResponse.json(
          { success: false, error: "Geçersiz tutar." },
          { status: 400 }
        );
      }
      if (billingValidated.data.service_name !== LETTER_PANEL_BASKET) {
        return NextResponse.json(
          { success: false, error: "Geçersiz sepet / fatura hizmet adı." },
          { status: 400 }
        );
      }
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Bu ödeme için giriş yapmanız gerekir." },
          { status: 400 }
        );
      }
    }

    const couponRaw = typeof coupon_code === "string" ? coupon_code.trim() : "";
    if (couponRaw && isYurtdisiisCouponCode(couponRaw)) {
      if (Number(amount) !== AMOUNT_YURTDISIIS_DISCOUNTED) {
        return NextResponse.json(
          { success: false, error: "Geçersiz tutar veya kupon." },
          { status: 400 }
        );
      }
      const check = await verifyYurtdisiisCanUse(emailTrimmed, userId);
      if (!check.ok) {
        return NextResponse.json({ success: false, error: check.error }, { status: 400 });
      }
    }

    const couponNormalized = couponRaw ? normalizeTrCouponCode(couponRaw) : null;

    const user_name_val = typeof user_name === "string" ? user_name.trim().slice(0, 60) : "Müşteri";
    const user_address_val = typeof user_address === "string" && user_address.trim() ? user_address.trim().slice(0, 400) : "Adres girilmedi";
    const user_phone_val = typeof user_phone === "string" && user_phone.trim() ? user_phone.trim().slice(0, 20) : "5550000000";

    const supabase = getSupabaseAdmin();
    const snapshot =
      profile_snapshot && typeof profile_snapshot === "object"
        ? {
            method: profile_snapshot.method === "voice" || profile_snapshot.method === "chat" ? profile_snapshot.method : "form",
            country: profile_snapshot.country ?? null,
            job_area: profile_snapshot.job_area ?? null,
            job_branch: profile_snapshot.job_branch ?? null,
            answers: profile_snapshot.answers && typeof profile_snapshot.answers === "object" ? profile_snapshot.answers : {},
            photo_url: profile_snapshot.photo_url ?? null,
          }
        : null;

    const cvOrderId = typeof cv_order_id === "string" && cv_order_id.trim() ? cv_order_id.trim() : null;

    /** Aktif premium varken ikinci bir haftalık ödeme başlatılmaz (CV paketi / mektup paneli hariç). */
    if (userId && paymentTypeRaw === "weekly") {
      const { data: activeRows } = await supabase
        .from("premium_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .gt("ends_at", new Date().toISOString())
        .limit(1);
      if (activeRows && activeRows.length > 0) {
        return NextResponse.json(
          { success: false, error: "active_premium_subscription" },
          { status: 409 }
        );
      }
    }

    const { data: paymentRow, error: paymentInsertError } = await supabase
      .from("payments")
      .insert({
        profile_id: null,
        user_id: userId,
        provider: "paytr",
        status: "started",
        amount: Number(amount),
        currency: "TRY",
        provider_ref: merchant_oid,
        profile_snapshot: snapshot,
        payment_type: typeof payment_type === "string" && payment_type.trim() ? payment_type.trim() : null,
        coupon_code: couponNormalized,
      })
      .select("id")
      .single();
    if (paymentInsertError || !paymentRow?.id) {
      console.error("[PayTR initiate] payments insert failed", paymentInsertError);
      return NextResponse.json({ success: false, error: "Ödeme kaydı oluşturulamadı." }, { status: 500 });
    }

    // CV paketi siparişi varsa ödeme referansını bağla ki callback'te sipariş statüsü ilerletilebilsin.
    if (cvOrderId) {
      await supabase
        .from("cv_orders")
        .update({
          merchant_oid,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cvOrderId);
    }

    const token = await getPaytrToken(
      {
        merchant_oid,
        email: emailTrimmed,
        amount: Number(amount),
        user_name: user_name_val || "Müşteri",
        user_address: user_address_val,
        user_phone: user_phone_val,
        merchant_ok_url: typeof merchant_ok_url === "string" ? merchant_ok_url.trim() : undefined,
        merchant_fail_url: typeof merchant_fail_url === "string" ? merchant_fail_url.trim() : undefined,
        basket_description: typeof basket_description === "string" ? basket_description : undefined,
      },
      getClientIp(request)
    );

    const billingIns = await insertBillingIndividualPaytrPending(supabase, {
      userId: userId,
      orderId: cvOrderId,
      paymentUuid: paymentRow.id,
      merchantOid: merchant_oid,
      billing: billingValidated.data,
      couponCode: couponNormalized,
      source: paymentTypeRaw || "paytr_initiate",
    });
    if (billingIns.error) {
      console.error("[PayTR initiate] billing insert failed (ödeme token üretildi)", billingIns.error);
    }

    const iframe_url = `https://www.paytr.com/odeme/guvenli/${token.token}`;
    return NextResponse.json({
      success: true,
      token: token.token,
      iframe_url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ödeme başlatılamadı";
    if (typeof message === "string" && (message.includes("Gerekli") || message.includes("gerekli") || message.includes("post"))) {
      console.warn("[PayTR initiate] PayTR API hatası:", message);
      return NextResponse.json(
        { success: false, error: "Ödeme sağlayıcısı gerekli bilgileri alamadı. Lütfen sayfayı yenileyip tekrar deneyin. Sorun devam ederse destek ile iletişime geçin." },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
