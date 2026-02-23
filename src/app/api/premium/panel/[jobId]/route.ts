import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Tek ilan id'si ile panel için gerekli tüm veriyi döndürür: ilan + (varsa veya yeni oluşturulmuş) rehber.
 * Auth zorunlu; rehber yoksa draft oluşturulur (idempotent).
 */
async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseForUser(token);
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { user, supabase } : null;
}

const JOB_COLS = "id, title, position_text, location_text, source_name, source_url, snippet, published_at, analysis_status, analysis_json";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = (await params).jobId;
  const jobId = typeof raw === "string" ? raw.trim() : "";
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: job, error: jobErr } = await admin
    .from("job_posts")
    .select(JOB_COLS)
    .eq("id", jobId)
    .maybeSingle();

  if (jobErr) {
    console.warn("[premium/panel] job_posts query error", { jobId, message: jobErr.message });
    return NextResponse.json({ error: jobErr.message, requestedId: jobId }, { status: 500 });
  }
  if (!job) {
    console.warn("[premium/panel] job not found", { jobId, length: jobId.length });
    return NextResponse.json({ error: "Not found", requestedId: jobId }, { status: 404 });
  }

  const { data: existingGuide, error: guideErr } = await auth.supabase
    .from("job_guides")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("job_post_id", jobId)
    .maybeSingle();

  let guide = guideErr ? null : existingGuide ?? null;

  if (!guide) {
    const { data: created, error: insertErr } = await auth.supabase
      .from("job_guides")
      .insert({
        user_id: auth.user.id,
        job_post_id: jobId,
        status: "draft",
        progress_step: 1,
        answers_json: {},
      })
      .select()
      .single();

    if (insertErr) {
      if ((insertErr as { code?: string }).code === "23505") {
        const { data: existing } = await auth.supabase
          .from("job_guides")
          .select("*")
          .eq("user_id", auth.user.id)
          .eq("job_post_id", jobId)
          .maybeSingle();
        guide = existing ?? null;
      } else {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    } else {
      guide = created;
    }
  }

  return NextResponse.json({ job, guide });
}
