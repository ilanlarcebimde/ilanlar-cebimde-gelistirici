import type { SupabaseClient } from "@supabase/supabase-js";
import type { IndividualBillingPayload } from "@/lib/billingIndividual";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PayTR öncesi: ödeme satırı uuid + merchant_oid ile bekleyen fatura kaydı. */
export async function insertBillingIndividualPaytrPending(
  supabase: SupabaseClient,
  args: {
    userId: string | null;
    orderId: string | null;
    paymentUuid: string;
    merchantOid: string;
    billing: IndividualBillingPayload;
    couponCode: string | null;
    source: string | null;
    paymentType?: string | null;
  }
): Promise<{ error: string | null }> {
  const b = args.billing;
  const row = {
    user_id: args.userId,
    order_id: args.orderId,
    payment_id: args.paymentUuid,
    payment_provider: "paytr",
    service_name: b.service_name,
    payer_type: "individual",
    first_name: b.first_name,
    last_name: b.last_name,
    tckn: b.tckn,
    email: b.email,
    phone: b.phone,
    address_line1: b.address_line1,
    address_line2: b.address_line2 ?? null,
    district: b.district,
    city: b.city,
    postal_code: b.postal_code,
    invoice_note: b.invoice_note ?? null,
    coupon_code: args.couponCode ?? b.pricing.coupon_code ?? null,
    gross_amount: b.pricing.gross_amount,
    discount_amount: b.pricing.discount_amount,
    net_amount: b.pricing.net_amount,
    payment_status: "pending",
    paytr_callback_reference: args.merchantOid,
    source: args.source,
    confirm_invoice_accuracy: b.confirm_invoice_accuracy,
    confirm_terms: b.confirm_terms,
    updated_at: new Date().toISOString(),
    metadata: {
      stage: "pending_paytr",
      payments_uuid: args.paymentUuid,
      payment_type: args.paymentType ?? null,
      merchant_oid: args.merchantOid,
    },
  };
  const { error } = await supabase.from("billing_individual_details").insert(row);
  if (error) {
    console.error("[billing] insert pending failed", error);
    return { error: error.message || "Fatura kaydı oluşturulamadı." };
  }
  return { error: null };
}

/** Kupon / ücretsiz tamamlama — PayTR satırı yok; payment_id sentetik anahtar. */
export async function insertBillingIndividualCouponCompleted(
  supabase: SupabaseClient,
  args: {
    userId: string | null;
    orderId: string | null;
    paymentIdKey: string;
    billing: IndividualBillingPayload;
    couponCode: string | null;
    source: string | null;
    profileId?: string | null;
    premiumSubscriptionId?: string | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<{ error: string | null }> {
  const b = args.billing;
  const meta = {
    stage: "coupon_completed",
    source: args.source,
    payment_id_key: args.paymentIdKey,
    ...(args.metadata && typeof args.metadata === "object" ? args.metadata : {}),
  };
  const row = {
    user_id: args.userId,
    order_id: args.orderId,
    payment_id: args.paymentIdKey,
    payment_provider: "paytr",
    service_name: b.service_name,
    payer_type: "individual",
    first_name: b.first_name,
    last_name: b.last_name,
    tckn: b.tckn,
    email: b.email,
    phone: b.phone,
    address_line1: b.address_line1,
    address_line2: b.address_line2 ?? null,
    district: b.district,
    city: b.city,
    postal_code: b.postal_code,
    invoice_note: b.invoice_note ?? null,
    coupon_code: args.couponCode ?? b.pricing.coupon_code ?? null,
    gross_amount: b.pricing.gross_amount,
    discount_amount: b.pricing.discount_amount,
    net_amount: b.pricing.net_amount,
    payment_status: "completed",
    paytr_callback_reference: null,
    source: args.source,
    confirm_invoice_accuracy: b.confirm_invoice_accuracy,
    confirm_terms: b.confirm_terms,
    updated_at: new Date().toISOString(),
    profile_id: args.profileId && UUID_RE.test(args.profileId) ? args.profileId : null,
    premium_subscription_id:
      args.premiumSubscriptionId && UUID_RE.test(args.premiumSubscriptionId) ? args.premiumSubscriptionId : null,
    metadata: meta,
  };
  const { error } = await supabase.from("billing_individual_details").insert(row);
  if (error) {
    if (error.code === "23505") {
      return { error: null };
    }
    console.error("[billing] insert coupon completed failed", error);
    return { error: error.message || "Fatura kaydı oluşturulamadı." };
  }
  return { error: null };
}

/**
 * PayTR callback başarı — fatura satırına ödeme tamamlandı + abonelik/profil/sipariş bağları ve metadata.
 * (initiate’te oluşan pending satırı güncellenir.)
 */
export async function syncBillingIndividualPaytrCompleted(
  supabase: SupabaseClient,
  args: {
    merchantOid: string;
    paytrTotalAmount?: string;
    paymentsUuid?: string | null;
    paymentType?: string | null;
    couponCode?: string | null;
    profileId?: string | null;
    premiumSubscriptionId?: string | null;
    orderId?: string | null;
    userId?: string | null;
    extraMetadata?: Record<string, unknown>;
  }
): Promise<void> {
  const metadata: Record<string, unknown> = {
    stage: "paytr_completed",
    paytr_total_amount: args.paytrTotalAmount ?? null,
    payments_uuid: args.paymentsUuid ?? null,
    payment_type: args.paymentType ?? null,
    coupon_code: args.couponCode ?? null,
    ...args.extraMetadata,
  };
  const patch: Record<string, unknown> = {
    payment_status: "completed",
    metadata,
    updated_at: new Date().toISOString(),
  };
  if (args.profileId && UUID_RE.test(args.profileId)) patch.profile_id = args.profileId;
  if (args.premiumSubscriptionId && UUID_RE.test(args.premiumSubscriptionId)) {
    patch.premium_subscription_id = args.premiumSubscriptionId;
  }
  if (args.orderId && UUID_RE.test(args.orderId)) patch.order_id = args.orderId;
  if (args.userId && UUID_RE.test(args.userId)) patch.user_id = args.userId;

  const { error } = await supabase.from("billing_individual_details").update(patch).eq("paytr_callback_reference", args.merchantOid);
  if (error) {
    console.error("[billing] sync paytr completed failed", error);
  }
}
