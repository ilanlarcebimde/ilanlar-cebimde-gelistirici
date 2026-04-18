import { NextRequest, NextResponse } from "next/server";
import { makeCallbackHash } from "@/lib/paytr";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { executePaytrSuccessSideEffects } from "@/lib/paytrSuccessAfterPayment";

/** PayTR bildirim endpoint'i. Her durumda 200 + "OK" dönülmeli; redirect olmamalı. */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const merchant_oid = (formData.get("merchant_oid") as string) || "";
    const status = (formData.get("status") as string) || "";
    const total_amount = (formData.get("total_amount") as string) || "";
    const hash = (formData.get("hash") as string) || "";

    console.log("[PAYTR] callback received", { merchant_oid, status });

    const expectedHash = makeCallbackHash(merchant_oid, status, total_amount);
    const hashOk = hash === expectedHash;

    if (!hashOk || status !== "success") {
      return new NextResponse("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const supabase = getSupabaseAdmin();

    // İdempotans: Sadece ilk kez "started -> success" geçişinde işlem yap; aynı merchant_oid tekrar gelirse webhook tetiklenmez
    const { data: updatedRows } = await supabase
      .from("payments")
      .update({ status: "success" })
      .eq("provider_ref", merchant_oid)
      .eq("provider", "paytr")
      .eq("status", "started")
      .select("id, profile_id, profile_snapshot, user_id, payment_type, coupon_code");

    if (!updatedRows || updatedRows.length === 0) {
      console.log("[PAYTR] already processed, skip webhook", merchant_oid);
      return new NextResponse("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const payment = updatedRows[0];
    await executePaytrSuccessSideEffects(supabase, {
      merchant_oid,
      total_amount,
      payment,
    });

    return new NextResponse("OK", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    // Hata olsa bile PayTR'ye 200 + OK
  }

  return new NextResponse("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
