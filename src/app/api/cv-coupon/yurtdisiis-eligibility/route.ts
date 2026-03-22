import { NextResponse } from "next/server";
import { verifyYurtdisiisCanUse } from "@/lib/yurtdisiisCouponServer";

/** Yurtdışı CV kuponu (YURTDİSİNDAİS) tek kullanım kontrolü — ödeme sayfasından çağrılır */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      user_id?: string | null;
    };
    const email = typeof body.email === "string" ? body.email : "";
    const userId = typeof body.user_id === "string" && body.user_id.trim() ? body.user_id.trim() : null;

    const result = await verifyYurtdisiisCanUse(email, userId);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[yurtdisiis-eligibility]", e);
    return NextResponse.json({ ok: false, error: "İstek işlenemedi." }, { status: 500 });
  }
}
