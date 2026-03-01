import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import { isPremiumPlusSubscriptionActive } from "@/lib/premiumSubscription";

export const runtime = "nodejs";

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseForUser(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { user, supabase } : null;
}

/**
 * GET /api/apply/full-merkezi-post?post_id=<uuid>
 * Returns a job-like object from merkezi_posts + contact for the Cover Letter Wizard.
 * Premium Plus required (same as cover letter wizard).
 */
export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "supabase_not_configured", detail: "Server env missing" },
      { status: 503 }
    );
  }

  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPremiumPlus = await isPremiumPlusSubscriptionActive(auth.user.id);
  if (!hasPremiumPlus) {
    return NextResponse.json(
      { error: "premium_plus_required", detail: "Bu özellik Premium Plus abonelerine açıktır." },
      { status: 403 }
    );
  }

  const postId = req.nextUrl.searchParams.get("post_id")?.trim() ?? "";
  if (!postId) {
    return NextResponse.json({ error: "Missing post_id" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: post, error: postErr } = await supabase
      .from("merkezi_posts")
      .select("id, title, company_name, country_slug, country_name, city, sector_slug, sector_name")
      .eq("id", postId)
      .eq("status", "published")
      .maybeSingle();

    if (postErr || !post) {
      return NextResponse.json(
        { error: "Not found", requestedId: postId },
        { status: 404 }
      );
    }

    const { data: contact } = await supabase
      .from("merkezi_post_contact")
      .select("contact_email, contact_phone, apply_url")
      .eq("post_id", postId)
      .maybeSingle();

    const locationText = [post.country_name ?? post.country_slug, post.city].filter(Boolean).join(", ");
    const jobLike = {
      id: post.id,
      title: post.title,
      source_name: post.company_name ?? null,
      company_name: post.company_name ?? null,
      country: post.country_name ?? post.country_slug ?? null,
      location_text: locationText || null,
      application_email: contact?.contact_email ?? null,
      contact_email: contact?.contact_email ?? null,
    };

    return NextResponse.json(jobLike as Record<string, unknown>);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[apply/full-merkezi-post] error", postId, msg);
    return NextResponse.json(
      { error: "internal_error", detail: msg.slice(0, 200), requestedId: postId },
      { status: 500 }
    );
  }
}
