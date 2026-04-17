import type { SupabaseClient } from "@supabase/supabase-js";
import type { IndividualBillingPayload } from "@/lib/billingIndividual";

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
  }
): Promise<{ error: string | null }> {
  const b = args.billing;
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

export async function markBillingIndividualCompletedByPaytrOid(
  supabase: SupabaseClient,
  merchantOid: string
): Promise<void> {
  await supabase
    .from("billing_individual_details")
    .update({
      payment_status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("paytr_callback_reference", merchantOid);
}
