import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseForUser } from "@/lib/supabase/server";
import {
  ADMINSUPER2026_CODE,
  ADMINSUPER2026_COOLDOWN_MS,
  getAdminsuperServiceKey,
  isAdminsuper2026EmailAllowed,
  isAdminsuperBuiltinTestEmail,
} from "@/lib/adminsuper2026";
import { assertBillingMatchesPaytrInitiate, validateIndividualBillingPayload } from "@/lib/billingIndividual";
import {
  buildLetterPanelCheckoutPricing,
  buildOdemeCheckoutPricing,
  getPaymentTypeFromPending,
  type PaytrPendingShape,
} from "@/lib/odemePaytrPendingPricing";
import {
  insertBillingIndividualPaytrCompletedFallback,
  insertBillingIndividualPaytrPending,
} from "@/lib/billingIndividualRecord";
import { executePaytrSuccessSideEffects, type PaytrSuccessPaymentRow } from "@/lib/paytrSuccessAfterPayment";
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

/**
 * Eski DB şemalarında (048 öncesi) `payment_type` / `coupon_code` olmayabilir — SELECT yalnızca var olan kolonlarla yapılır.
 */
async function fetchPaymentRowFlexible(
  supabase: SupabaseClient,
  paymentId: string
): Promise<PaytrSuccessPaymentRow | null> {
  const full = await supabase
    .from("payments")
    .select("id, profile_id, profile_snapshot, user_id, payment_type, coupon_code")
    .eq("id", paymentId)
    .maybeSingle();
  if (!full.error && full.data) {
    return full.data as PaytrSuccessPaymentRow;
  }

  const mid = await supabase
    .from("payments")
    .select("id, profile_id, profile_snapshot, user_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (!mid.error && mid.data) {
    return {
      ...(mid.data as Omit<PaytrSuccessPaymentRow, "payment_type" | "coupon_code">),
      payment_type: null,
      coupon_code: null,
    };
  }

  const min = await supabase
    .from("payments")
    .select("id, profile_id, user_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (!min.error && min.data) {
    return {
      id: min.data.id,
      profile_id: min.data.profile_id,
      profile_snapshot: null,
      user_id: min.data.user_id,
      payment_type: null,
      coupon_code: null,
    };
  }

  return null;
}

/**
 * PayTR simülasyonu: satır doğrudan `success` olarak yazılır.
 * Önce yalnızca çekirdek kolonlar (002 şeması); 007/048 kolonları ayrı PATCH ile (yoksa sessizce atlanır).
 */
async function insertAdminsuperPaymentSuccessRow(
  supabase: SupabaseClient,
  args: {
    merchant_oid: string;
    userId: string | null;
    amountClean: number;
    snapshot: Record<string, unknown> | null;
    payment_type: string | null;
    coupon_code: string;
  }
): Promise<{ ok: true; row: PaytrSuccessPaymentRow } | { ok: false; error: string }> {
  const base = {
    profile_id: null as string | null,
    user_id: args.userId,
    provider: "paytr" as const,
    status: "success" as const,
    amount: args.amountClean,
    currency: "TRY",
    provider_ref: args.merchant_oid,
  };

  let { data: paymentRows, error: paymentInsertError } = await supabase.from("payments").insert(base).select("id");
  let paymentId = paymentRows?.[0]?.id;

  if (!paymentInsertError && !paymentId) {
    const { data: r } = await supabase
      .from("payments")
      .select("id")
      .eq("provider_ref", args.merchant_oid)
      .eq("provider", "paytr")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (r?.id) paymentId = r.id;
  }

  if (paymentInsertError || !paymentId) {
    console.error("[adminsuper2026] payments insert(success) core failed", paymentInsertError);
    return { ok: false, error: "Ödeme kaydı oluşturulamadı." };
  }

  if (args.snapshot) {
    const { error: e } = await supabase.from("payments").update({ profile_snapshot: args.snapshot }).eq("id", paymentId);
    if (e) console.warn("[adminsuper2026] optional profile_snapshot skipped", JSON.stringify(e));
  }
  if (args.payment_type) {
    const { error: e } = await supabase.from("payments").update({ payment_type: args.payment_type }).eq("id", paymentId);
    if (e) console.warn("[adminsuper2026] optional payment_type skipped", JSON.stringify(e));
  }
  {
    const { error: e } = await supabase.from("payments").update({ coupon_code: args.coupon_code }).eq("id", paymentId);
    if (e) console.warn("[adminsuper2026] optional coupon_code skipped", JSON.stringify(e));
  }

  const row = await fetchPaymentRowFlexible(supabase, paymentId);
  if (!row) {
    console.error("[adminsuper2026] payments fetch after insert(success) failed", { paymentId });
    return { ok: false, error: "Ödeme onayı yazılamadı." };
  }

  return { ok: true, row };
}

async function checkAdminsuperCooldown(
  admin: SupabaseClient,
  userId: string,
  serviceKey: string
): Promise<{ ok: true } | { ok: false; retryAfterMinutes: number }> {
  const { data: row, error } = await admin
    .from("adminsuper_test_usage")
    .select("last_used_at")
    .eq("user_id", userId)
    .eq("service_key", serviceKey)
    .maybeSingle();

  if (error) {
    console.error("[adminsuper2026] adminsuper_test_usage okunamadı — 059 migration veya service_role; bekleme atlanıyor.", error);
    return { ok: true };
  }

  if (!row?.last_used_at) return { ok: true };

  const elapsed = Date.now() - new Date(row.last_used_at).getTime();
  if (elapsed >= ADMINSUPER2026_COOLDOWN_MS) return { ok: true };

  const retryAfterMinutes = Math.max(1, Math.ceil((ADMINSUPER2026_COOLDOWN_MS - elapsed) / 60000));
  return { ok: false, retryAfterMinutes };
}

async function recordAdminsuperCooldown(admin: SupabaseClient, userId: string, serviceKey: string) {
  const { error } = await admin.from("adminsuper_test_usage").upsert(
    {
      user_id: userId,
      service_key: serviceKey,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "user_id,service_key" }
  );
  if (error) {
    console.error("[adminsuper2026] adminsuper_test_usage yazılamadı", error);
  }
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
    /** Sadece env ile eklenen hesaplarda 1 saat / hizmet sınırı; gömülü test e-postalarında yok (sık test). */
    const applyAdminsuperUsageThrottle = !isAdminsuperBuiltinTestEmail(user.email);

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

      const serviceKeyLetter = getAdminsuperServiceKey({ letterPanel: true, pending: null });
      if (applyAdminsuperUsageThrottle) {
        const coolLetter = await checkAdminsuperCooldown(admin, user.id, serviceKeyLetter);
        if (!coolLetter.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `Bu hizmet için test kuponu yaklaşık ${coolLetter.retryAfterMinutes} dk sonra tekrar kullanılabilir.`,
              retry_after_minutes: coolLetter.retryAfterMinutes,
            },
            { status: 429 }
          );
        }
      }

      const merchant_oid = `ord_adm2026_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const amountClean = roundTryAmount(pricing.netAmount);

      const paymentDoneLetter = await insertAdminsuperPaymentSuccessRow(admin, {
        merchant_oid,
        userId: user.id,
        amountClean,
        snapshot: null,
        payment_type: LETTER_PANEL_PAYMENT_TYPE,
        coupon_code: ADMINSUPER2026_CODE,
      });
      if (!paymentDoneLetter.ok) {
        return NextResponse.json({ success: false, error: paymentDoneLetter.error }, { status: 500 });
      }

      let billIns = await insertBillingIndividualPaytrPending(admin, {
        userId: user.id,
        orderId: null,
        paymentUuid: paymentDoneLetter.row.id,
        merchantOid: merchant_oid,
        billing: v.data,
        couponCode: ADMINSUPER2026_CODE,
        source: "adminsuper2026_letter_panel",
        paymentType: LETTER_PANEL_PAYMENT_TYPE,
      });
      if (billIns.error) {
        billIns = await insertBillingIndividualPaytrCompletedFallback(admin, {
          userId: user.id,
          orderId: null,
          paymentUuid: paymentDoneLetter.row.id,
          merchantOid: merchant_oid,
          billing: v.data,
          couponCode: ADMINSUPER2026_CODE,
          source: "adminsuper2026_letter_panel",
          paymentType: LETTER_PANEL_PAYMENT_TYPE,
          paytrTotalAmount: String(amountClean),
        });
      }
      if (billIns.error) {
        return NextResponse.json({ success: false, error: billIns.error }, { status: 500 });
      }

      await executePaytrSuccessSideEffects(admin, {
        merchant_oid,
        total_amount: String(amountClean),
        payment: paymentDoneLetter.row,
      });

      if (applyAdminsuperUsageThrottle) {
        await recordAdminsuperCooldown(admin, user.id, serviceKeyLetter);
      }

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

    const serviceKeyOdeme = getAdminsuperServiceKey({ letterPanel: false, pending: pending as PaytrPendingShape });
    if (applyAdminsuperUsageThrottle) {
      const coolOdeme = await checkAdminsuperCooldown(admin, user.id, serviceKeyOdeme);
      if (!coolOdeme.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Bu hizmet için test kuponu yaklaşık ${coolOdeme.retryAfterMinutes} dk sonra tekrar kullanılabilir.`,
            retry_after_minutes: coolOdeme.retryAfterMinutes,
          },
          { status: 429 }
        );
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

    const paymentDoneOdeme = await insertAdminsuperPaymentSuccessRow(admin, {
      merchant_oid,
      userId: resolvedUserId,
      amountClean,
      snapshot,
      payment_type: paymentTypeStr,
      coupon_code: ADMINSUPER2026_CODE,
    });
    if (!paymentDoneOdeme.ok) {
      return NextResponse.json({ success: false, error: paymentDoneOdeme.error }, { status: 500 });
    }

    if (cvOrderId) {
      await admin
        .from("cv_orders")
        .update({
          merchant_oid,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cvOrderId);
    }

    let billIns = await insertBillingIndividualPaytrPending(admin, {
      userId: resolvedUserId,
      orderId: cvOrderId,
      paymentUuid: paymentDoneOdeme.row.id,
      merchantOid: merchant_oid,
      billing: v.data,
      couponCode: ADMINSUPER2026_CODE,
      source: "adminsuper2026_odeme",
      paymentType: paymentTypeStr,
    });
    if (billIns.error) {
      billIns = await insertBillingIndividualPaytrCompletedFallback(admin, {
        userId: resolvedUserId,
        orderId: cvOrderId,
        paymentUuid: paymentDoneOdeme.row.id,
        merchantOid: merchant_oid,
        billing: v.data,
        couponCode: ADMINSUPER2026_CODE,
        source: "adminsuper2026_odeme",
        paymentType: paymentTypeStr,
        paytrTotalAmount: String(amountClean),
      });
    }
    if (billIns.error) {
      return NextResponse.json({ success: false, error: billIns.error }, { status: 500 });
    }

    await executePaytrSuccessSideEffects(admin, {
      merchant_oid,
      total_amount: String(amountClean),
      payment: paymentDoneOdeme.row,
    });

    if (applyAdminsuperUsageThrottle) {
      await recordAdminsuperCooldown(admin, user.id, serviceKeyOdeme);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[adminsuper2026]", e);
    return NextResponse.json({ success: false, error: "İşlem başarısız" }, { status: 500 });
  }
}
