import type { SupabaseClient } from "@supabase/supabase-js";
import { syncBillingIndividualPaytrCompleted } from "@/lib/billingIndividualRecord";
import { LETTER_PANEL_PAYMENT_TYPE } from "@/lib/letterPanelUnlock";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidProfileId(id: string | null): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

export type PaytrSuccessPaymentRow = {
  id: string;
  profile_id: string | null;
  profile_snapshot: unknown;
  user_id: string | null;
  payment_type: string | null;
  coupon_code: string | null;
};

/**
 * PayTR callback’te veya test/admin tamamlamada: ödeme satırı "success" olduktan sonra
 * cv siparişi, premium, profil, fatura sync ve n8n webhook.
 */
export async function executePaytrSuccessSideEffects(
  supabase: SupabaseClient,
  args: {
    merchant_oid: string;
    total_amount: string;
    payment: PaytrSuccessPaymentRow;
  }
): Promise<void> {
  const { merchant_oid, total_amount, payment } = args;
  const paymentId = payment?.id ?? null;

  let profileId: string | null = payment?.profile_id ?? null;
  let premiumSubscriptionId: string | null = null;
  const userId = payment?.user_id ?? null;
  const isLetterPanelUnlock = payment?.payment_type === LETTER_PANEL_PAYMENT_TYPE;

  await supabase
    .from("cv_orders")
    .update({
      payment_status: "paid",
      order_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("merchant_oid", merchant_oid);

  const { data: cvOrderForBilling } = await supabase
    .from("cv_orders")
    .select("id")
    .eq("merchant_oid", merchant_oid)
    .maybeSingle();
  const billingOrderId = cvOrderForBilling?.id ?? null;

  if (userId && paymentId && !isLetterPanelUnlock) {
    const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: premRow, error: insertError } = await supabase
      .from("premium_subscriptions")
      .insert({
        user_id: userId,
        profile_id: profileId,
        payment_id: paymentId,
        ends_at: endsAt,
        payment_type: payment?.payment_type ?? "standard",
        coupon_code: payment?.coupon_code ?? null,
      })
      .select("id")
      .maybeSingle();
    if (insertError || !premRow?.id) {
      const { data: fbPrem, error: fallbackError } = await supabase
        .from("premium_subscriptions")
        .insert({
          user_id: userId,
          profile_id: profileId,
          payment_id: paymentId,
          ends_at: endsAt,
        })
        .select("id")
        .maybeSingle();
      if (fallbackError) {
        console.error("[paytr success] premium_subscriptions insert failed", {
          userId,
          paymentId,
          insertError,
          fallbackError,
        });
      } else {
        premiumSubscriptionId = fbPrem?.id ?? null;
      }
    } else {
      premiumSubscriptionId = premRow.id;
    }
  }

  if (!profileId && payment?.profile_snapshot && typeof payment.profile_snapshot === "object") {
    const snap = payment.profile_snapshot as {
      method?: string;
      country?: string | null;
      job_area?: string | null;
      job_branch?: string | null;
      answers?: Record<string, unknown>;
      photo_url?: string | null;
    };
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        user_id: null,
        method: snap.method === "voice" || snap.method === "chat" ? snap.method : "form",
        status: "paid",
        country: snap.country ?? null,
        job_area: snap.job_area ?? null,
        job_branch: snap.job_branch ?? null,
        answers: snap.answers && typeof snap.answers === "object" ? snap.answers : {},
        photo_url: snap.photo_url ?? null,
        is_cv_sent: false,
      })
      .select("id")
      .single();
    profileId = newProfile?.id ?? null;
    if (profileId) {
      await supabase.from("payments").update({ profile_id: profileId }).eq("provider_ref", merchant_oid).eq("provider", "paytr");
      if (userId && paymentId) {
        await supabase
          .from("premium_subscriptions")
          .update({ profile_id: profileId })
          .eq("user_id", userId)
          .eq("payment_id", paymentId);
      }
    }
  } else if (profileId) {
    await supabase.from("profiles").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", profileId);
  }

  if (profileId) {
    await supabase.from("events").insert({
      user_id: userId,
      profile_id: profileId,
      type: "payment_success",
      payload: { merchant_oid, total_amount },
    });
  }

  await syncBillingIndividualPaytrCompleted(supabase, {
    merchantOid: merchant_oid,
    paytrTotalAmount: total_amount,
    paymentsUuid: paymentId,
    paymentType: payment?.payment_type ?? null,
    couponCode: payment?.coupon_code ?? null,
    profileId,
    premiumSubscriptionId,
    orderId: billingOrderId,
    userId,
  });

  const webhookUrl = process.env.N8N_CV_WEBHOOK_URL?.trim() || "";
  console.log("[paytr success] webhook branch", { profileId, webhookUrl: webhookUrl ? "set" : "missing" });

  if (!webhookUrl) {
    if (profileId) {
      await supabase.from("events").insert({
        user_id: userId,
        profile_id: profileId,
        type: "n8n_webhook_skipped_missing_env",
        payload: { merchant_oid },
      });
    }
    return;
  }

  if (!isValidProfileId(profileId)) {
    if (profileId) {
      await supabase.from("events").insert({
        user_id: userId,
        profile_id: null,
        type: "n8n_webhook_skipped_invalid_profile",
        payload: { merchant_oid, profile_id: profileId },
      });
    }
    return;
  }

  try {
    const url = new URL(webhookUrl);
    url.searchParams.set("profile_id", profileId);
    url.searchParams.set("payment_id", merchant_oid);
    url.searchParams.set("status", "success");
    url.searchParams.set("ts", new Date().toISOString());
    const res = await fetch(url.toString(), { method: "GET" });
    console.log("[paytr success] n8n webhook response", { ok: res.ok, status: res.status });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      await supabase.from("events").insert({
        user_id: userId,
        profile_id: profileId,
        type: "n8n_webhook_failed",
        payload: { merchant_oid, status: res.status, body: txt.slice(0, 500) },
      });
    }
  } catch (err) {
    console.error("[paytr success] n8n webhook failed", err);
    await supabase.from("events").insert({
      user_id: userId,
      profile_id: profileId,
      type: "n8n_webhook_failed",
      payload: { merchant_oid, error: String(err) },
    });
  }
}
