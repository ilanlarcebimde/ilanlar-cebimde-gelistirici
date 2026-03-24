import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { normalizeAccessCode } from "@/lib/freeAccessCodes";

export const runtime = "nodejs";

async function getAuth(req: NextRequest) {
  void req;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: adminRow } = await supabase.from("app_admin").select("id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return null;
  return { user, supabase };
}

export type FreeAccessCodeRow = {
  id: string;
  code: string;
  description: string | null;
  target_slug: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

/** GET: Tüm kodlar (admin) */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("free_access_codes")
    .select(
      "id, code, description, target_slug, starts_at, expires_at, is_active, usage_limit, usage_count, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** POST: Yeni kod */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    code?: string;
    description?: string | null;
    target_slug?: string;
    starts_at?: string;
    expires_at?: string;
    is_active?: boolean;
    usage_limit?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const codeRaw = typeof body.code === "string" ? body.code : "";
  const normalized = normalizeAccessCode(codeRaw);
  if (!normalized) {
    return NextResponse.json({ error: "Kod boş olamaz." }, { status: 400 });
  }

  const target_slug =
    typeof body.target_slug === "string" && body.target_slug.trim()
      ? body.target_slug.trim()
      : "is-basvuru-mektubu-olustur";

  const starts_at = typeof body.starts_at === "string" ? body.starts_at.trim() : "";
  const expires_at = typeof body.expires_at === "string" ? body.expires_at.trim() : "";
  if (!starts_at || !expires_at) {
    return NextResponse.json({ error: "Başlangıç ve bitiş tarihi zorunludur." }, { status: 400 });
  }

  const s = new Date(starts_at);
  const e = new Date(expires_at);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) {
    return NextResponse.json({ error: "Geçersiz tarih aralığı." }, { status: 400 });
  }

  const is_active = body.is_active !== false;
  const usage_limit =
    body.usage_limit === null || body.usage_limit === undefined
      ? null
      : typeof body.usage_limit === "number" && body.usage_limit > 0
        ? Math.floor(body.usage_limit)
        : null;

  const description =
    typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;

  const nowIso = new Date().toISOString();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("free_access_codes")
    .insert({
      code: normalized,
      description,
      target_slug,
      starts_at: s.toISOString(),
      expires_at: e.toISOString(),
      is_active,
      usage_limit,
      usage_count: 0,
      updated_at: nowIso,
    })
    .select(
      "id, code, description, target_slug, starts_at, expires_at, is_active, usage_limit, usage_count, created_at, updated_at"
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Bu kod zaten kayıtlı." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
