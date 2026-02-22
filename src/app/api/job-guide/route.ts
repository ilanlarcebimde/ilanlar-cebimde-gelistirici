import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseForUser(token);
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { user, supabase } : null;
}

/** GET: Mevcut kullanıcının bu ilan için job_guide kaydını getir (yoksa 404). */
export async function GET(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jobPostId = searchParams.get("jobPostId");
  if (!jobPostId) return NextResponse.json({ error: "jobPostId required" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("job_guides")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("job_post_id", jobPostId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** POST: Draft job_guide oluştur (user_id + job_post_id). Varsa mevcut kaydı dön. */
export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { jobPostId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const jobPostId = body?.jobPostId;
  if (!jobPostId) return NextResponse.json({ error: "jobPostId required" }, { status: 400 });

  const { data: existing } = await auth.supabase
    .from("job_guides")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("job_post_id", jobPostId)
    .maybeSingle();

  if (existing) return NextResponse.json(existing);

  const { data: created, error } = await auth.supabase
    .from("job_guides")
    .insert({
      user_id: auth.user.id,
      job_post_id: jobPostId,
      status: "draft",
      progress_step: 1,
      answers_json: {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(created);
}

/** PATCH: answers_json, status, progress_step güncelle (sadece kendi kaydı). */
export async function PATCH(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { jobGuideId?: string; answers_json?: Record<string, unknown>; status?: string; progress_step?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const jobGuideId = body?.jobGuideId;
  if (!jobGuideId) return NextResponse.json({ error: "jobGuideId required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.answers_json !== undefined) updates.answers_json = body.answers_json;
  if (body.status === "draft" || body.status === "in_progress" || body.status === "completed") updates.status = body.status;
  if (typeof body.progress_step === "number" && body.progress_step >= 1 && body.progress_step <= 7) updates.progress_step = body.progress_step;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("job_guides")
    .update(updates)
    .eq("id", jobGuideId)
    .eq("user_id", auth.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
