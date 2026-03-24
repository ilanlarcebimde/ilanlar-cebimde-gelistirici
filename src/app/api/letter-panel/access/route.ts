import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import {
  LETTER_PANEL_AMOUNT_TRY,
  LETTER_PANEL_COOKIE_NAME,
  LETTER_PANEL_PAYMENT_TYPE,
  verifyLetterPanelCookieValue,
} from "@/lib/letterPanelUnlock";

export const runtime = "nodejs";

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseForUser(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Oturum + (şifre cookie’si veya başarılı tek seferlik ödeme kaydı) ile panel erişimi.
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user?.id) {
    return NextResponse.json({ unlocked: false, reason: "unauthorized" as const }, { status: 401 });
  }

  const jar = await cookies();
  const raw = jar.get(LETTER_PANEL_COOKIE_NAME)?.value;
  if (verifyLetterPanelCookieValue(raw, user.id)) {
    return NextResponse.json({ unlocked: true, via: "password_cookie" as const });
  }

  const supabase = getSupabaseAdmin();
  const { data: row } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", "paytr")
    .eq("status", "success")
    .eq("payment_type", LETTER_PANEL_PAYMENT_TYPE)
    .eq("amount", LETTER_PANEL_AMOUNT_TRY)
    .limit(1)
    .maybeSingle();

  if (row?.id) {
    return NextResponse.json({ unlocked: true, via: "payment" as const });
  }

  return NextResponse.json({ unlocked: false, via: null });
}
