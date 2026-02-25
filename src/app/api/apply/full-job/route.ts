import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import { isPremiumSubscriptionActive } from "@/lib/premiumSubscription";

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
 * GET /api/apply/full-job?job_id=<uuid>
 * Returns FULL job_posts record (all columns). Auth required.
 * Used to start the gated "Nasıl Başvururum?" wizard.
 */
export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[apply/full-job] SUPABASE env missing");
    return NextResponse.json(
      { error: "supabase_not_configured", detail: "Server env missing" },
      { status: 503 }
    );
  }

  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasActivePremium = await isPremiumSubscriptionActive(auth.user.id);
  if (!hasActivePremium) {
    return NextResponse.json(
      { error: "premium_required", detail: "Haftalık premium aboneliğiniz yok veya süresi dolmuş. Erişim için abonelik gereklidir." },
      { status: 403 }
    );
  }

  const jobId = req.nextUrl.searchParams.get("job_id")?.trim() ?? "";
  if (!jobId) {
    return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: job, error: jobErr } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr) {
      console.error("[apply/full-job] job_posts fetch error", jobId, jobErr);
      return NextResponse.json(
        {
          error: "job_posts_fetch_failed",
          detail: jobErr.message?.slice(0, 200) ?? "Unknown",
          requestedId: jobId,
        },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: "Not found", requestedId: jobId },
        { status: 404 }
      );
    }

    return NextResponse.json(job as Record<string, unknown>);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[apply/full-job] unexpected error", jobId, msg, err);
    return NextResponse.json(
      { error: "internal_error", detail: msg.slice(0, 200), requestedId: jobId },
      { status: 500 }
    );
  }
}
