import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const THROTTLE_HOURS = 12;

const VIEWER_COOKIE = "merkezi_viewer";

/** POST: Görüntülenme say (throttle: aynı viewer_key için 12 saatte 1). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  void req;
  const supabase = getSupabaseAdmin();
  const cookieStore = await cookies();
  let viewer = cookieStore.get(VIEWER_COOKIE)?.value ?? "";
  let shouldSetCookie = false;
  if (!viewer) {
    viewer = crypto.randomUUID();
    shouldSetCookie = true;
  }
  const viewerKey = `viewer:${viewer}`;
  const since = new Date(Date.now() - THROTTLE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from("merkezi_post_views")
    .select("id")
    .eq("post_id", postId)
    .eq("viewer_key", viewerKey)
    .gte("viewed_at", since)
    .limit(1)
    .maybeSingle();

  const res = NextResponse.json({ ok: true, counted: !existing });
  if (shouldSetCookie) {
    res.cookies.set({
      name: VIEWER_COOKIE,
      value: viewer,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  if (existing) return res;

  await supabase.from("merkezi_post_views").insert({
    post_id: postId,
    viewer_key: viewerKey,
  });

  return res;
}
