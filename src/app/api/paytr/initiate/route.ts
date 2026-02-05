import { NextRequest, NextResponse } from "next/server";
import { getPaytrToken, getSiteUrl } from "@/lib/paytr";

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
    };

    if (!merchant_oid || !email || amount == null || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "merchant_oid, email ve amount (0'dan büyük) zorunludur." },
        { status: 400 }
      );
    }

    const siteUrl = getSiteUrl();
    const token = await getPaytrToken(
      {
        merchant_oid,
        email,
        amount: Number(amount),
        user_name,
        user_address,
        user_phone,
        merchant_ok_url: merchant_ok_url || undefined,
        merchant_fail_url: merchant_fail_url || undefined,
        basket_description,
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
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
