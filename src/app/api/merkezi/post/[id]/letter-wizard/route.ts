import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import { isPremiumSubscriptionActive } from "@/lib/premiumSubscription";

export const runtime = "nodejs";

const LETTER_WEBHOOK_URL = process.env.N8N_LETTER_WEBHOOK_URL?.trim() || "";

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

type Body = {
  session_id?: string;
  step?: number;
  approved?: boolean;
  derived?: { mode?: "job_specific" | "generic" };
  answers?: Record<string, unknown>;
  locale?: string;
};

/**
 * POST /api/merkezi/post/[id]/letter-wizard
 * Step 6 of Cover Letter Wizard for merkezi post: validate, build job-like payload, call n8n.
 * Same response shape as howto-step cover_letter step 6.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  if (!postId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPremium = await isPremiumSubscriptionActive(auth.user.id);
  if (!hasPremium) {
    return NextResponse.json(
      { error: "premium_required", detail: "Bu özellik için haftalık Premium aboneliği gereklidir." },
      { status: 403 }
    );
  }

  if (!LETTER_WEBHOOK_URL) {
    return NextResponse.json(
      { error: "webhook_not_configured", detail: "N8N_LETTER_WEBHOOK_URL is not set" },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
  const required = ["full_name", "email", "total_experience_years", "top_skills", "work_permit_status", "passport_status", "motivation"];
  const missing = required.filter((k) => {
    const v = answers[k];
    if (k === "top_skills") return !Array.isArray(v) || v.length < 2;
    return v == null || String(v).trim() === "";
  });
  if (missing.length) {
    return NextResponse.json(
      { error: "invalid_request", detail: "Step 2–5 verileri eksik: " + missing.join(", ") },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: post, error: postErr } = await supabase
    .from("merkezi_posts")
    .select("id, title, company_name, country_slug, country_name, city, sector_slug, sector_name")
    .eq("id", postId)
    .eq("status", "published")
    .maybeSingle();

  if (postErr || !post) {
    return NextResponse.json({ error: "Not found", requestedId: postId }, { status: 404 });
  }

  const { data: contact } = await supabase
    .from("merkezi_post_contact")
    .select("contact_email, contact_phone, apply_url")
    .eq("post_id", postId)
    .maybeSingle();

  const locationText = [post.country_name ?? post.country_slug, post.city].filter(Boolean).join(", ");
  const jobLike: Record<string, unknown> = {
    id: post.id,
    title: post.title,
    source_name: post.company_name ?? null,
    company_name: post.company_name ?? null,
    country: post.country_name ?? post.country_slug ?? null,
    location_text: locationText || null,
    application_email: contact?.contact_email ?? null,
    contact_email: contact?.contact_email ?? null,
  };

  const letterPayload = {
    intent: "cover_letter_generate",
    session_id: body.session_id ?? "",
    step: 6,
    approved: body.approved === true,
    locale: body.locale ?? "tr-TR",
    job: jobLike,
    derived: body.derived ?? {},
    answers,
    request: { version: 1 },
  };

  try {
    const webhookRes = await fetch(LETTER_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(letterPayload),
    });

    const contentType = webhookRes.headers.get("content-type") ?? "";
    let webhookData: unknown;
    if (contentType.includes("application/json")) {
      try {
        webhookData = await webhookRes.json();
      } catch {
        webhookData = { _raw: await webhookRes.text() };
      }
    } else {
      webhookData = { _raw: await webhookRes.text() };
    }

    if (!webhookRes.ok) {
      const detailObj = webhookData && typeof webhookData === "object" && webhookData !== null ? (webhookData as Record<string, unknown>) : null;
      const fallback =
        typeof detailObj?.message === "string"
          ? detailObj.message
          : typeof detailObj?.error === "string"
            ? detailObj.error
            : typeof detailObj?.detail === "string"
              ? detailObj.detail
              : "Mektup servisi geçici olarak yanıt vermiyor.";
      return NextResponse.json(
        { error: "webhook_error", status: webhookRes.status, detail: fallback },
        { status: 502 }
      );
    }

    return NextResponse.json(webhookData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[merkezi/letter-wizard] webhook error", postId, msg);
    return NextResponse.json(
      { error: "webhook_error", detail: "Mektup servisi geçici olarak yanıt vermiyor." },
      { status: 502 }
    );
  }
}
