import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForUser, getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const TARGET_EMAIL_14_DAYS = "mhmtcskn42@gmail.com";
const TARGET_EMAIL_UNLIMITED = "ilanlarcebimde@gmail.com";

const AUTO_COUPON_CODE_14_DAYS = "ICMERKEZI14";
const AUTO_COUPON_DURATION_DAYS_14_DAYS = 14;

const AUTO_COUPON_CODE_UNLIMITED = "ADMIN_FREE_UNLIMITED";
// Ultra uzun tarih: `ends_at > now()` kontrolü için “fiili sınırsız” kabul edilir.
const AUTO_COUPON_ENDS_AT_UNLIMITED_ISO = "9999-12-31T23:59:59.999Z";

function normalizeEmail(email: string | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabase = getSupabaseForUser(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedEmail = normalizeEmail(user.email);

    // Sadece istenen e-postalar için otomatik premium grant edilir.
    if (normalizedEmail !== TARGET_EMAIL_14_DAYS && normalizedEmail !== TARGET_EMAIL_UNLIMITED) {
      return NextResponse.json({ success: true, granted: false, reason: "not_target_email" }, { status: 200 });
    }

    const nowIso = new Date().toISOString();
    const admin = getSupabaseAdmin();

    // Aynı kullanıcı için hali hazırda aktif premium varsa tekrar ekleme.
    const { data: existingRows, error: existingError } = await admin
      .from("premium_subscriptions")
      .select("id, ends_at, payment_type, coupon_code")
      .eq("user_id", user.id)
      .gt("ends_at", nowIso)
      .order("ends_at", { ascending: false })
      .limit(1);

    if (existingError) {
      console.error("[premium/auto-grant-email-coupon] existing query error", existingError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (existingRows && existingRows.length > 0) {
      return NextResponse.json(
        { success: true, granted: false, reason: "already_active", ends_at: existingRows[0]?.ends_at ?? null },
        { status: 200 },
      );
    }

    const endsAt =
      normalizedEmail === TARGET_EMAIL_UNLIMITED
        ? AUTO_COUPON_ENDS_AT_UNLIMITED_ISO
        : new Date(Date.now() + AUTO_COUPON_DURATION_DAYS_14_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const couponCode =
      normalizedEmail === TARGET_EMAIL_UNLIMITED ? AUTO_COUPON_CODE_UNLIMITED : AUTO_COUPON_CODE_14_DAYS;

    const { error: insertError } = await admin.from("premium_subscriptions").insert({
      user_id: user.id,
      profile_id: null,
      payment_id: null,
      ends_at: endsAt,
      payment_type: "coupon",
      coupon_code: couponCode,
    });

    if (insertError) {
      // Eski şema uyumluluğu: payment_type/coupon_code kolonları yoksa minimum insert ile devam et.
      const { error: fallbackError } = await admin.from("premium_subscriptions").insert({
        user_id: user.id,
        profile_id: null,
        payment_id: null,
        ends_at: endsAt,
      });
      if (fallbackError) {
        console.error("[premium/auto-grant-email-coupon] insert failed", { insertError, fallbackError });
        return NextResponse.json({ error: "Premium kaydı oluşturulamadı" }, { status: 500 });
      }
    }

    // Client tarafında event ile UI refresh tetiklenir.
    return NextResponse.json({ success: true, granted: true, ends_at: endsAt }, { status: 200 });
  } catch (e) {
    console.error("[premium/auto-grant-email-coupon]", e);
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}

