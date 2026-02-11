import { NextRequest, NextResponse } from "next/server";
import { makeCallbackHash } from "@/lib/paytr";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidProfileId(id: string | null): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

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
      .select("profile_id, profile_snapshot, user_id");

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
    let profileId: string | null = payment?.profile_id ?? null;
    const userId = payment?.user_id ?? null;

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
          answers: snap.answers ?? {},
          photo_url: snap.photo_url ?? null,
        })
        .select("id")
        .single();
      profileId = newProfile?.id ?? null;
      if (profileId) {
        await supabase.from("payments").update({ profile_id: profileId }).eq("provider_ref", merchant_oid).eq("provider", "paytr");
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

    const webhookUrl = process.env.N8N_CV_WEBHOOK_URL?.trim() || "";
    console.log("[PAYTR] success branch", { profileId, webhookUrl: webhookUrl ? "set" : "missing" });

    if (!webhookUrl) {
      if (profileId) {
        await supabase.from("events").insert({
          user_id: userId,
          profile_id: profileId,
          type: "n8n_webhook_skipped_missing_env",
          payload: { merchant_oid },
        });
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

    if (!isValidProfileId(profileId)) {
      if (profileId) {
        await supabase.from("events").insert({
          user_id: userId,
          profile_id: null,
          type: "n8n_webhook_skipped_invalid_profile",
          payload: { merchant_oid, profile_id: profileId },
        });
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

    try {
      const url = new URL(webhookUrl);
      url.searchParams.set("profile_id", profileId);
      url.searchParams.set("payment_id", merchant_oid);
      url.searchParams.set("status", "success");
      url.searchParams.set("ts", new Date().toISOString());
      const res = await fetch(url.toString(), { method: "GET" });
      console.log("[PAYTR] n8n webhook response", { ok: res.ok, status: res.status });
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
      console.error("[PAYTR] n8n webhook failed", err);
      await supabase.from("events").insert({
        user_id: userId,
        profile_id: profileId,
        type: "n8n_webhook_failed",
        payload: { merchant_oid, error: String(err) },
      });
    }

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
