import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForUser, getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PREMIUM_COUPON_CODE = "ADMIN89";

/** ADMIN89: Haftalık premium (7 gün) tanımlı; sadece giriş yapmış kullanıcıya uygulanır. */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const supabase = getSupabaseForUser(token);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { code?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
    const code = (body?.code ?? "").trim().toUpperCase();
    if (code !== PREMIUM_COUPON_CODE) {
      return NextResponse.json({ error: "Geçersiz kupon kodu" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from("premium_subscriptions").insert({
      user_id: user.id,
      profile_id: null,
      payment_id: null,
      ends_at: endsAt,
    });

    return NextResponse.json({ success: true, ends_at: endsAt });
  } catch (e) {
    console.error("[premium/apply-coupon]", e);
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
