import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseForUser } from "@/lib/supabase/server";
import { ADMINSUPER2026_CODE, isAdminsuper2026EmailAllowed } from "@/lib/adminsuper2026";
import { assertBillingMatchesPaytrInitiate, validateIndividualBillingPayload } from "@/lib/billingIndividual";
import {
  buildLetterPanelCheckoutPricing,
  buildOdemeCheckoutPricing,
  getPaymentTypeFromPending,
  type PaytrPendingShape,
} from "@/lib/odemePaytrPendingPricing";
import { insertBillingIndividualPaytrPending } from "@/lib/billingIndividualRecord";
import { executePaytrSuccessSideEffects } from "@/lib/paytrSuccessAfterPayment";
import { LETTER_PANEL_BASKET, LETTER_PANEL_PAYMENT_TYPE } from "@/lib/letterPanelUnlock";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return UUID_REGEX.test(t) ? t : null;
}

function roundTryAmount(n: number): number {
  return Math.round(n * 100) / 100;
}

function safeProfileSnapshotForDb(
  profile_snapshot: {
    method?: string;
    country?: string | null;
    job_area?: string | null;
    job_branch?: string | null;
    answers?: Record<string, unknown>;
    photo_url?: string | null;
  } | null | undefined
): Record<string, unknown> | null {
  if (!profile_snapshot || typeof profile_snapshot !== "object") return null;
  try {
    const normalized = {
      method: profile_snapshot.method === "voice" || profile_snapshot.method === "chat" ? profile_snapshot.method : "form",
      country: profile_snapshot.country ?? null,
      job_area: profile_snapshot.job_area ?? null,
      job_branch: profile_snapshot.job_branch ?? null,
      answers: profile_snapshot.answers && typeof profile_snapshot.answers === "object" ? profile_snapshot.answers : {},
      photo_url: profile_snapshot.photo_url ?? null,
    };
    const s = JSON.stringify(normalized);
    if (s.length > 1_200_000) {
      return { method: normalized.method, country: normalized.country, answers: {}, photo_url: null };
    }
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function insertPaymentStarted(
  supabase: SupabaseClient,
  args: {
    merchant_oid: string;
    userId: string | null;
    amountClean: number;
    snapshot: Record<string, unknown> | null;
    payment_type: string | null;
    coupon_code: string;
  }
): Promise<{ ok: true; paymentId: string } | { ok: false; error: string }> {
  const fullRow = {
    profile_id: null as string | null,
    user_id: args.userId,
    provider: "paytr" as const,
    status: "started" as const,
    amount: args.amountClean,
    currency: "TRY",
    provider_ref: args.merchant_oid,
    profile_snapshot: args.snapshot,
    payment_type: args.payment_type,
    coupon_code: args.coupon_code,
  };

  let { data: paymentRows, error: paymentInsertError } = await supabase.from("payments").insert(fullRow).select("id");
  let paymentRow = paymentRows?.[0];

  if (!paymentInsertError && !paymentRow?.id) {
    const { data: r } = await supabase
      .from("payments")
      .select("id")
      .eq("provider_ref", args.merchant_oid)
      .eq("provider", "paytr")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (r?.id) paymentRow = r;
  }

  if (!paymentInsertError && paymentRow?.id) {
    return { ok: true, paymentId: paymentRow.id };
  }

  if (paymentInsertError) {
    console.error("[adminsuper2026] payments full insert failed", JSON.stringify(paymentInsertError));
  }

  const minimalRow = {
    profile_id: null as string | null,
    user_id: args.userId,
    provider: "paytr" as const,
    status: "started" as const,
    amount: args.amountClean,
    currency: "TRY",
    provider_ref: args.merchant_oid,
  };

  ({ data: paymentRows, error: paymentInsertError } = await supabase.from("payments").insert(minimalRow).select("id"));
  paymentRow = paymentRows?.[0];

  if (!paymentInsertError && !paymentRow?.id) {
    const { data: r } = await supabase
      .from("payments")
      .select("id")
      .eq("provider_ref", args.merchant_oid)
      .eq("provider", "paytr")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (r?.id) paymentRow = r;
  }

  if (paymentInsertError || !paymentRow?.id) {
    return { ok: false, error: "Ödeme kaydı oluşturulamadı." };
  }

  const patch: Record<string, unknown> = {};
  if (args.snapshot) patch.profile_snapshot = args.snapshot;
  if (args.payment_type) patch.payment_type = args.payment_type;
  patch.coupon_code = args.coupon_code;
  if (Object.keys(patch).length > 0) {
    const { error: patchErr } = await supabase.from("payments").update(patch).eq("id", paymentRow.id);
    if (patchErr) {
      console.warn("[adminsuper2026] payments patch failed", JSON.stringify(patchErr));
    }
  }

  return { ok: true, paymentId: paymentRow.id };
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const userSb = getSupabaseForUser(token);
    const {
      data: { user },
    } = await userSb.auth.getUser();
    if (!user?.email || !user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdminsuper2026EmailAllowed(user.email)) {
      return NextResponse.json({ success: false, error: "Bu kupon kullanılamıyor." }, { status: 403 });
    }

    const body = (await req.json()) as {
      code?: string;
      individual_billing?: unknown;
      pending?: PaytrPendingShape & Record<string, unknown>;
      letter_panel?: boolean;
    };

    if ((body.code ?? "").trim().toUpperCase() !== ADMINSUPER2026_CODE) {
      return NextResponse.json({ success: false, error: "Geçersiz kupon." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    if (body.letter_panel === true) {
      const pricing = buildLetterPanelCheckoutPricing();
      if (pricing.serviceName !== LETTER_PANEL_BASKET) {
        return NextResponse.json({ success: false, error: "Geçersiz ürün." }, { status: 400 });
      }
      const v = validateIndividualBillingPayload(body.individual_billing ?? null, {
        paytrEmail: user.email,
        skipPaytrEmailMatch: false,
      });
      if (!v.ok) return NextResponse.json({ success: false, error: v.error }, { status: 400 });
      const match = assertBillingMatchesPaytrInitiate(v.data, {
        amount: pricing.netAmount,
        basket_description: pricing.serviceName,
      });
      if (!match.ok) return NextResponse.json({ success: false, error: match.error }, { status: 400 });

      const merchant_oid = `ord_adm2026_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const amountClean = roundTryAmount(pricing.netAmount);

      const ins = await insertPaymentStarted(admin, {
        merchant_oid,
        userId: user.id,
        amountClean,
        snapshot: null,
        payment_type: LETTER_PANEL_PAYMENT_TYPE,
        coupon_code: ADMINSUPER2026_CODE,
      });
      if (!ins.ok) return NextResponse.json({ success: false, error: ins.error }, { status: 500 });

      const billIns = await insertBillingIndividualPaytrPending(admin, {
        userId: user.id,
        orderId: null,
        paymentUuid: ins.paymentId,
        merchantOid: merchant_oid,
        billing: v.data,
        couponCode: ADMINSUPER2026_CODE,
        source: "adminsuper2026_letter_panel",
        paymentType: LETTER_PANEL_PAYMENT_TYPE,
      });
      if (billIns.error) console.error("[adminsuper2026] billing insert failed", billIns.error);

      const { data: succRows } = await admin
        .from("payments")
        .update({ status: "success" })
        .eq("id", ins.paymentId)
        .eq("status", "started")
        .select("id, profile_id, profile_snapshot, user_id, payment_type, coupon_code");

      if (!succRows?.[0]) {
        return NextResponse.json({ success: false, error: "Ödeme onayı yazılamadı." }, { status: 500 });
      }

      await executePaytrSuccessSideEffects(admin, {
        merchant_oid,
        total_amount: String(amountClean),
        payment: succRows[0],
      });

      return NextResponse.json({ success: true });
    }

    const pending = body.pending;
    if (!pending || typeof pending !== "object") {
      return NextResponse.json({ success: false, error: "Oturum (pending) gerekli." }, { status: 400 });
    }
    const emailTrimmed = typeof pending.email === "string" ? pending.email.trim() : "";
    if (!emailTrimmed) {
      return NextResponse.json({ success: false, error: "E-posta gerekli." }, { status: 400 });
    }

    const v = validateIndividualBillingPayload(body.individual_billing ?? null, {
      paytrEmail: emailTrimmed,
    });
    if (!v.ok) return NextResponse.json({ success: false, error: v.error }, { status: 400 });

    const pricing = buildOdemeCheckoutPricing(pending as PaytrPendingShape);
    if (!pricing) {
      return NextResponse.json({ success: false, error: "Geçersiz sepet." }, { status: 400 });
    }
    const match = assertBillingMatchesPaytrInitiate(v.data, {
      amount: pricing.netAmount,
      basket_description: pricing.serviceName,
    });
    if (!match.ok) return NextResponse.json({ success: false, error: match.error }, { status: 400 });

    const pendingUserId = parseUuid(pending.user_id);
    if (pendingUserId && pendingUserId !== user.id) {
      return NextResponse.json({ success: false, error: "Oturum bu sipariş ile eşleşmiyor." }, { status: 403 });
    }

    const paymentTypeStr = getPaymentTypeFromPending(pending as PaytrPendingShape);

    if (paymentTypeStr === "weekly") {
      const { data: activeRows } = await admin
        .from("premium_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .gt("ends_at", new Date().toISOString())
        .limit(1);
      if (activeRows && activeRows.length > 0) {
        return NextResponse.json({ success: false, error: "active_premium_subscription" }, { status: 409 });
      }
    }

    const cvOrderId = parseUuid(pending.cv_order_id);

    const rawSnap =
      typeof pending.method === "string"
        ? {
            method: pending.method,
            country: (pending.country as string | null | undefined) ?? null,
            job_area: (pending.job_area as string | null | undefined) ?? null,
            job_branch: (pending.job_branch as string | null | undefined) ?? null,
            answers:
              pending.answers && typeof pending.answers === "object" ? (pending.answers as Record<string, unknown>) : {},
            photo_url: (pending.photo_url as string | null | undefined) ?? null,
          }
        : null;
    const snapshot = safeProfileSnapshotForDb(rawSnap);

    const resolvedUserId = pendingUserId ?? user.id;

    const merchant_oid = `ord_adm2026_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const amountClean = roundTryAmount(pricing.netAmount);

    const ins = await insertPaymentStarted(admin, {
      merchant_oid,
      userId: resolvedUserId,
      amountClean,
      snapshot,
      payment_type: paymentTypeStr,
      coupon_code: ADMINSUPER2026_CODE,
    });
    if (!ins.ok) return NextResponse.json({ success: false, error: ins.error }, { status: 500 });

    if (cvOrderId) {
      await admin
        .from("cv_orders")
        .update({
          merchant_oid,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cvOrderId);
    }

    const billIns = await insertBillingIndividualPaytrPending(admin, {
      userId: resolvedUserId,
      orderId: cvOrderId,
      paymentUuid: ins.paymentId,
      merchantOid: merchant_oid,
      billing: v.data,
      couponCode: ADMINSUPER2026_CODE,
      source: "adminsuper2026_odeme",
      paymentType: paymentTypeStr,
    });
    if (billIns.error) console.error("[adminsuper2026] billing insert failed", billIns.error);

    const { data: succRows } = await admin
      .from("payments")
      .update({ status: "success" })
      .eq("id", ins.paymentId)
      .eq("status", "started")
      .select("id, profile_id, profile_snapshot, user_id, payment_type, coupon_code");

    if (!succRows?.[0]) {
      return NextResponse.json({ success: false, error: "Ödeme onayı yazılamadı." }, { status: 500 });
    }

    await executePaytrSuccessSideEffects(admin, {
      merchant_oid,
      total_amount: String(amountClean),
      payment: succRows[0],
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[adminsuper2026]", e);
    return NextResponse.json({ success: false, error: "İşlem başarısız" }, { status: 500 });
  }
}
