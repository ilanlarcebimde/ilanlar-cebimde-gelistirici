import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

/** POST: Beğeni ekle (sadece giriş). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  void req;
  const supabaseUser = await getSupabaseServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("merkezi_post_likes")
    .insert({ post_id: postId, user_id: user.id, liker_key: null });

  if (error) {
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** DELETE: Beğeni kaldır (sadece giriş yapmış kullanıcı kendi kaydını silebilir). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  void req;
  const supabaseUser = await getSupabaseServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("merkezi_post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
