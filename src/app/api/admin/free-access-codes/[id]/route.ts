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

/** PATCH: Kod güncelle */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Bad request" }, { status: 400 });

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

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.code === "string") {
    const n = normalizeAccessCode(body.code);
    if (!n) return NextResponse.json({ error: "Kod boş olamaz." }, { status: 400 });
    patch.code = n;
  }
  if (body.description !== undefined) {
    patch.description =
      typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  }
  if (typeof body.target_slug === "string" && body.target_slug.trim()) {
    patch.target_slug = body.target_slug.trim();
  }
  if (typeof body.starts_at === "string" && body.starts_at.trim()) {
    const s = new Date(body.starts_at);
    if (Number.isNaN(s.getTime())) return NextResponse.json({ error: "Geçersiz başlangıç." }, { status: 400 });
    patch.starts_at = s.toISOString();
  }
  if (typeof body.expires_at === "string" && body.expires_at.trim()) {
    const e = new Date(body.expires_at);
    if (Number.isNaN(e.getTime())) return NextResponse.json({ error: "Geçersiz bitiş." }, { status: 400 });
    patch.expires_at = e.toISOString();
  }
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (body.usage_limit === null) {
    patch.usage_limit = null;
  } else if (typeof body.usage_limit === "number" && body.usage_limit > 0) {
    patch.usage_limit = Math.floor(body.usage_limit);
  }

  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("free_access_codes")
    .select("starts_at, expires_at")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const starts = patch.starts_at ?? existing.starts_at;
  const ends = patch.expires_at ?? existing.expires_at;
  if (new Date(ends as string) <= new Date(starts as string)) {
    return NextResponse.json({ error: "Bitiş tarihi başlangıçtan sonra olmalıdır." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("free_access_codes")
    .update(patch)
    .eq("id", id)
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

/** DELETE: Sil */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("free_access_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
