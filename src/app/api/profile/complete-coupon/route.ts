import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Kupon ile ödeme tamamlandığında çağrılır.
 * Body'de tam profil verisi gelir; profiles'a tek seferde paid olarak yazılır ve n8n webhook tetiklenir.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const method = body?.method === "voice" || body?.method === "chat" ? body.method : "form";
    const country = body?.country ?? null;
    const job_area = body?.job_area ?? null;
    const job_branch = body?.job_branch ?? null;
    const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};
    const photo_url = body?.photo_url ?? null;
    const userId = typeof body?.user_id === "string" && body.user_id.trim() ? body.user_id.trim() : null;

    const supabase = getSupabaseAdmin();
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        user_id: userId ?? null,
        method,
        status: "paid",
        country: country ?? null,
        job_area: job_area ?? null,
        job_branch: job_branch ?? null,
        answers: answers && typeof answers === "object" ? answers : {},
        photo_url: photo_url ?? null,
        is_cv_sent: false,
      })
      .select("id")
      .single();

    const profileId = newProfile?.id ?? null;
    if (insertError || !profileId) {
      console.error("[complete-coupon] profiles insert failed", insertError);
      return NextResponse.json(
        { success: false, error: insertError?.message || "Profil oluşturulamadı" },
        { status: 500 }
      );
    }

    await supabase.from("events").insert({
      user_id: null,
      profile_id: profileId,
      type: "payment_success",
      payload: { source: "coupon" },
    });

    const webhookUrl = process.env.N8N_CV_WEBHOOK_URL?.trim() || "";
    if (!webhookUrl) {
      await supabase.from("events").insert({
        user_id: null,
        profile_id: profileId,
        type: "n8n_webhook_skipped_missing_env",
        payload: { payment_id: "coupon" },
      });
    } else {
      try {
        const url = new URL(webhookUrl);
        url.searchParams.set("profile_id", profileId);
        url.searchParams.set("payment_id", "coupon");
        url.searchParams.set("status", "success");
        url.searchParams.set("ts", new Date().toISOString());
        const res = await fetch(url.toString(), { method: "GET" });
        console.log("[complete-coupon] n8n webhook response", { ok: res.ok, status: res.status });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          await supabase.from("events").insert({
            user_id: null,
            profile_id: profileId,
            type: "n8n_webhook_failed",
            payload: { payment_id: "coupon", status: res.status, body: txt.slice(0, 500) },
          });
        }
      } catch (err) {
        console.error("[complete-coupon] n8n webhook failed", err);
        await supabase.from("events").insert({
          user_id: null,
          profile_id: profileId,
          type: "n8n_webhook_failed",
          payload: { payment_id: "coupon", error: String(err) },
        });
      }
    }

    // Haftalık premium: kuponla tamamlanan kullanıcı (user_id gönderilmişse) 7 gün abonelik alır
    if (userId) {
      const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("premium_subscriptions").insert({
        user_id: userId,
        profile_id: profileId,
        payment_id: null,
        ends_at: endsAt,
      });
    }

    return NextResponse.json({ success: true, profile_id: profileId });
  } catch (e) {
    console.error("[complete-coupon] error", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
