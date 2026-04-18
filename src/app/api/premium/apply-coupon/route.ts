import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForUser, getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PREMIUM_COUPON_CODES = ["ADMIN89", "99TLDENEME"];

/** Yalnızca tanımlı e-posta ile kullanılabilir; 14 gün premium (Başvuru Merkezi özel). */
const MERKEZI_14_GUN_CODE = "ICMERKEZI14";
const MERKEZI_14_GUN_EMAILS = new Set(["durmush514@gmail.com", "mhmtcskn42@gmail.com"]);

function normalizeEmail(email: string | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** Geçerli kuponlarla premium; çoğu kod 7 gün, ICMERKEZI14 yalnızca yetkili e-postada 14 gün. */
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

    let durationDays = 7;
    if (code === MERKEZI_14_GUN_CODE) {
      if (!MERKEZI_14_GUN_EMAILS.has(normalizeEmail(user.email))) {
        return NextResponse.json({ error: "Geçersiz kupon kodu" }, { status: 400 });
      }
      durationDays = 14;
    } else if (!PREMIUM_COUPON_CODES.includes(code)) {
      return NextResponse.json({ error: "Geçersiz kupon kodu" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const { data: subRow, error: insertError } = await admin
      .from("premium_subscriptions")
      .insert({
        user_id: user.id,
        profile_id: null,
        payment_id: null,
        ends_at: endsAt,
        payment_type: "coupon",
        coupon_code: code,
      })
      .select("id")
      .maybeSingle();
    if (insertError) {
      // Eski şema uyumluluğu: payment_type/coupon_code kolonları yoksa minimum insert ile devam et.
      const { data: fbRow, error: fallbackError } = await admin
        .from("premium_subscriptions")
        .insert({
          user_id: user.id,
          profile_id: null,
          payment_id: null,
          ends_at: endsAt,
        })
        .select("id")
        .maybeSingle();
      if (fallbackError) {
        console.error("[premium/apply-coupon] insert failed", { insertError, fallbackError, userId: user.id });
        return NextResponse.json({ error: "Premium kaydı oluşturulamadı" }, { status: 500 });
      }
      return NextResponse.json({ success: true, ends_at: endsAt, subscription_id: fbRow?.id ?? null });
    }

    return NextResponse.json({ success: true, ends_at: endsAt, subscription_id: subRow?.id ?? null });
  } catch (e) {
    console.error("[premium/apply-coupon]", e);
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
