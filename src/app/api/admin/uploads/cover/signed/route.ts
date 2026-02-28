import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "merkezi-covers";

function safeExt(name: string): string {
  const ext = (name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return ext || "jpg";
}

/**
 * İmzalı yükleme URL'si döndürür. Dosya istemciden doğrudan Supabase'e gider (Vercel 4.5MB limitini aşar).
 */
export async function POST(req: NextRequest) {
  const supabaseUser = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabaseUser
    .from("app_admin")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let ext = "jpg";
  try {
    const body = await req.json();
    if (body?.filename) ext = safeExt(body.filename);
  } catch {
    // ignore
  }
  const path = `${user.id}/${Date.now()}.${ext}`;
  const supabase = getSupabaseAdmin();

  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error) {
    console.error("[admin/uploads/cover/signed]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({
    path: signed.path,
    token: signed.token,
    publicUrl: publicUrlData.publicUrl,
  });
}
