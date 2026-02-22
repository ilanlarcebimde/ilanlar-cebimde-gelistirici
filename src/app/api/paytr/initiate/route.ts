import { NextRequest, NextResponse } from "next/server";
import { getPaytrToken, getSiteUrl } from "@/lib/paytr";
import { getSupabaseAdmin } from "@/lib/supabase/server";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchant_oid,
      email,
      amount,
      user_name,
      user_address,
      user_phone,
      merchant_ok_url,
      merchant_fail_url,
      basket_description,
      profile_snapshot,
      user_id: body_user_id,
    } = body as {
      merchant_oid?: string;
      email?: string;
      amount?: number;
      user_name?: string;
      user_address?: string;
      user_phone?: string;
      merchant_ok_url?: string;
      merchant_fail_url?: string;
      basket_description?: string;
      profile_snapshot?: {
        method?: string;
        country?: string | null;
        job_area?: string | null;
        job_branch?: string | null;
        answers?: Record<string, unknown>;
        photo_url?: string | null;
      };
      user_id?: string;
    };

    const emailTrimmed = typeof email === "string" ? email.trim() : "";
    if (!merchant_oid || !emailTrimmed || amount == null || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "merchant_oid, email ve amount (0'dan büyük) zorunludur." },
        { status: 400 }
      );
    }

    const user_name_val = typeof user_name === "string" ? user_name.trim().slice(0, 60) : "Müşteri";
    const user_address_val = typeof user_address === "string" && user_address.trim() ? user_address.trim().slice(0, 400) : "Adres girilmedi";
    const user_phone_val = typeof user_phone === "string" && user_phone.trim() ? user_phone.trim().slice(0, 20) : "5550000000";

    const supabase = getSupabaseAdmin();
    const snapshot =
      profile_snapshot && typeof profile_snapshot === "object"
        ? {
            method: profile_snapshot.method === "voice" || profile_snapshot.method === "chat" ? profile_snapshot.method : "form",
            country: profile_snapshot.country ?? null,
            job_area: profile_snapshot.job_area ?? null,
            job_branch: profile_snapshot.job_branch ?? null,
            answers: profile_snapshot.answers && typeof profile_snapshot.answers === "object" ? profile_snapshot.answers : {},
            photo_url: profile_snapshot.photo_url ?? null,
          }
        : null;

    const userId = typeof body_user_id === "string" && body_user_id.trim() ? body_user_id.trim() : null;
    await supabase.from("payments").insert({
      profile_id: null,
      user_id: userId,
      provider: "paytr",
      status: "started",
      amount: Number(amount),
      currency: "TRY",
      provider_ref: merchant_oid,
      profile_snapshot: snapshot,
    });

    const token = await getPaytrToken(
      {
        merchant_oid,
        email: emailTrimmed,
        amount: Number(amount),
        user_name: user_name_val || "Müşteri",
        user_address: user_address_val,
        user_phone: user_phone_val,
        merchant_ok_url: typeof merchant_ok_url === "string" ? merchant_ok_url.trim() : undefined,
        merchant_fail_url: typeof merchant_fail_url === "string" ? merchant_fail_url.trim() : undefined,
        basket_description: typeof basket_description === "string" ? basket_description : undefined,
      },
      getClientIp(request)
    );

    const iframe_url = `https://www.paytr.com/odeme/guvenli/${token.token}`;
    return NextResponse.json({
      success: true,
      token: token.token,
      iframe_url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ödeme başlatılamadı";
    if (typeof message === "string" && (message.includes("Gerekli") || message.includes("gerekli") || message.includes("post"))) {
      console.warn("[PayTR initiate] PayTR API hatası:", message);
      return NextResponse.json(
        { success: false, error: "Ödeme sağlayıcısı gerekli bilgileri alamadı. Lütfen sayfayı yenileyip tekrar deneyin. Sorun devam ederse destek ile iletişime geçin." },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
