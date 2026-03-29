import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isPremiumSubscriptionActive } from "@/lib/premiumSubscription";

export const runtime = "nodejs";

type LetterForm = {
  full_name?: string;
  experience_years?: number;
  role?: string;
  certificates?: string[];
  english_level?: string;
  has_passport?: boolean;
  has_visa?: boolean;
  salary_expectation?: string;
  accommodation_expectation?: string;
};

/** POST: Premium kullanıcı için ilana özel mektup üret (n8n webhook). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const supabaseUser = await getSupabaseServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const premium = await isPremiumSubscriptionActive(user.id, user.email ?? null);
  if (!premium) return NextResponse.json({ error: "Premium required" }, { status: 403 });

  let form: LetterForm;
  try {
    form = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: post, error: postErr } = await supabaseAdmin
    .from("merkezi_posts")
    .select("id, title, sector_slug, country_slug")
    .eq("id", postId)
    .maybeSingle();
  if (postErr || !post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const webhookUrl = process.env.N8N_LETTER_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "LETTER_WEBHOOK_MISSING" }, { status: 500 });
  }

  const payload = {
    user: {
      id: user.id,
      email: user.email,
    },
    post: {
      id: post.id,
      title: post.title,
      sector_slug: post.sector_slug,
      country_slug: post.country_slug,
    },
    form,
  };

  let letter;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "LETTER_WEBHOOK_FAILED" }, { status: 502 });
    }
    letter = await res.json();
  } catch (e) {
    console.error("[merkezi/letter] webhook error", e);
    return NextResponse.json({ error: "LETTER_WEBHOOK_ERROR" }, { status: 502 });
  }

  const { letter_en, letter_tr, subject_en, subject_tr } = letter as {
    letter_en?: string;
    letter_tr?: string;
    subject_en?: string;
    subject_tr?: string;
  };

  await supabaseAdmin.from("merkezi_generated_letters").insert({
    user_id: user.id,
    post_id: postId,
    letter_en: letter_en ?? null,
    letter_tr: letter_tr ?? null,
    subject_en: subject_en ?? null,
    subject_tr: subject_tr ?? null,
  });

  return NextResponse.json({ letter_en, letter_tr, subject_en, subject_tr });
}

