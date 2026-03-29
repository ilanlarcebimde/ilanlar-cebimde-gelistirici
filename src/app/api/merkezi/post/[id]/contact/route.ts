import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isPremiumSubscriptionActive } from "@/lib/premiumSubscription";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

/** GET: İletişim bilgisi — sadece (premium kullanıcı) veya (ücretsiz içerik + show_contact_when_free). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: post, error: postErr } = await supabase
    .from("merkezi_posts")
    .select("id, is_paid, show_contact_when_free")
    .eq("id", postId)
    .eq("status", "published")
    .maybeSingle();

  if (postErr || !post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const showContactFree = !post.is_paid && post.show_contact_when_free;
  if (showContactFree) {
    const { data: contact } = await supabase
      .from("merkezi_post_contact")
      .select("contact_email, contact_phone, apply_url")
      .eq("post_id", postId)
      .maybeSingle();
    return NextResponse.json(contact ?? { contact_email: null, contact_phone: null, apply_url: null });
  }

  if (!post.is_paid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabaseUser = await getSupabaseServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const premium = await isPremiumSubscriptionActive(user.id, user.email ?? null);
  if (!premium) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const { data: contact } = await supabase
    .from("merkezi_post_contact")
    .select("contact_email, contact_phone, apply_url")
    .eq("post_id", postId)
    .maybeSingle();

  return NextResponse.json(contact ?? { contact_email: null, contact_phone: null, apply_url: null });
}
