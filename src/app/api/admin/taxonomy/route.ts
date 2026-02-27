import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

async function getAuth() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: adminRow } = await supabase
    .from("app_admin")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) return null;
  return { user, supabase };
}

/** GET: Ülke ve sektör listeleri (admin panel için). */
export async function GET() {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: countries }, { data: sectors }] = await Promise.all([
    auth.supabase.from("merkezi_countries").select("id, name, slug").eq("is_active", true),
    auth.supabase.from("merkezi_sectors").select("id, name, slug").eq("is_active", true),
  ]);

  return NextResponse.json({
    countries: countries ?? [],
    sectors: sectors ?? [],
  });
}

/** POST: Yeni ülke / sektör ekle (admin). */
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { type?: "country" | "sector"; name?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type;
  const name = (body.name || "").trim();
  if (!type || !name) return NextResponse.json({ error: "type ve name zorunlu" }, { status: 400 });

  const baseSlug =
    (body.slug || name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || name.toLowerCase();

  const table = type === "country" ? "merkezi_countries" : "merkezi_sectors";
  const { data, error } = await auth.supabase
    .from(table)
    .insert({ name, slug: baseSlug })
    .select("id, name, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

