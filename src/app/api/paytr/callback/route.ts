import { NextRequest, NextResponse } from "next/server";
import { makeCallbackHash } from "@/lib/paytr";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** PayTR bildirim endpoint'i. Her durumda 200 + "OK" dönülmeli; redirect olmamalı. */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const merchant_oid = (formData.get("merchant_oid") as string) || "";
    const status = (formData.get("status") as string) || "";
    const total_amount = (formData.get("total_amount") as string) || "";
    const hash = (formData.get("hash") as string) || "";

    const expectedHash = makeCallbackHash(merchant_oid, status, total_amount);
    const hashOk = hash === expectedHash;

    if (hashOk && status === "success") {
      const supabase = getSupabaseAdmin();
      const { data: payment } = await supabase
        .from("payments")
        .select("profile_id, user_id")
        .eq("provider_ref", merchant_oid)
        .eq("provider", "paytr")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const profileId = payment?.profile_id ?? null;

      if (profileId) {
        await supabase.from("profiles").update({ status: "paid", updated_at: new Date().toISOString() }).eq("id", profileId);
        await supabase.from("payments").update({ status: "success" }).eq("provider_ref", merchant_oid).eq("provider", "paytr").eq("status", "started");
        await supabase.from("events").insert({
          user_id: payment?.user_id ?? null,
          profile_id: profileId,
          type: "payment_success",
          payload: { merchant_oid, total_amount },
        });
      }

      // n8n webhook: GET + query params; n8n profile_id ile profiles satırını okur
      const webhookUrl = process.env.N8N_CV_WEBHOOK_URL;
      if (webhookUrl && profileId) {
        try {
          const url = new URL(webhookUrl.trim());
          url.searchParams.set("profile_id", profileId);
          url.searchParams.set("payment_id", merchant_oid);
          url.searchParams.set("status", "success");
          url.searchParams.set("ts", new Date().toISOString());
          await fetch(url.toString(), { method: "GET" });
        } catch (err) {
          console.error("[PayTR callback] n8n webhook failed", err);
        }
      }
    }
    // Hash eşleşmese veya status === "failed" olsa bile PayTR'ye 200 OK veriyoruz
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
