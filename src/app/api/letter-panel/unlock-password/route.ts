import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import { LETTER_PANEL_TARGET_SLUG, normalizeAccessCode } from "@/lib/freeAccessCodes";
import {
  createLetterPanelCookieValue,
  LETTER_PANEL_COOKIE_MAX_AGE_SEC,
  LETTER_PANEL_COOKIE_NAME,
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
 * Admin panelde tanımlı geçerli kod ile httpOnly cookie set edilir.
 * Kodlar `free_access_codes` tablosundan doğrulanır (env sabiti yok).
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { code?: string; target_slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const raw = typeof body.code === "string" ? body.code : "";
  const normalized = normalizeAccessCode(raw);
  if (!normalized) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  const targetSlug =
    typeof body.target_slug === "string" && body.target_slug.trim()
      ? body.target_slug.trim()
      : LETTER_PANEL_TARGET_SLUG;

  const nowIso = new Date().toISOString();
  const admin = getSupabaseAdmin();

  const { data: row, error: selErr } = await admin
    .from("free_access_codes")
    .select("id, usage_limit, usage_count")
    .eq("code", normalized)
    .eq("target_slug", targetSlug)
    .eq("is_active", true)
    .lte("starts_at", nowIso)
    .gte("expires_at", nowIso)
    .maybeSingle();

  if (selErr) {
    console.error("[letter-panel/unlock-password] select", selErr);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  if (!row?.id) {
    return NextResponse.json({ ok: false, error: "invalid_or_expired" }, { status: 400 });
  }

  if (row.usage_limit != null && row.usage_count >= row.usage_limit) {
    return NextResponse.json({ ok: false, error: "usage_exhausted" }, { status: 400 });
  }

  const { error: upErr } = await admin
    .from("free_access_codes")
    .update({
      usage_count: row.usage_count + 1,
      updated_at: nowIso,
    })
    .eq("id", row.id);

  if (upErr) {
    console.error("[letter-panel/unlock-password] usage bump", upErr);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const token = createLetterPanelCookieValue(user.id);
  const jar = await cookies();
  jar.set(LETTER_PANEL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LETTER_PANEL_COOKIE_MAX_AGE_SEC,
  });

  return NextResponse.json({ ok: true });
}
