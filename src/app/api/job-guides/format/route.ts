import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import { formatJobGuideWithGemini } from "@/lib/job-guide/geminiFormatter";
import type { JobInput } from "@/lib/job-guide/formatterSchema";

export const runtime = "nodejs";

const JOB_COLS = "id, title, position_text, location_text, source_name, source_url, snippet, published_at";

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseForUser(token);
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { user, supabase } : null;
}

/** POST: jobId + isteğe bağlı answers. Girdi DB'den çekilir; çıktı formatter JSON (Gemini veya fallback). */
export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { jobId?: string; answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  let job: Record<string, unknown> | null = null;
  try {
    const admin = getSupabaseAdmin();
    const { data: jobAdmin, error: jobErr } = await admin
      .from("job_posts")
      .select(JOB_COLS)
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr) {
      const { data: jobUser, error: userErr } = await auth.supabase
        .from("job_posts")
        .select(JOB_COLS)
        .eq("id", jobId)
        .eq("status", "published")
        .maybeSingle();
      if (userErr || !jobUser) {
        return NextResponse.json(
          { error: "job_not_found", detail: (userErr ?? jobErr).message?.slice(0, 200) },
          { status: 404 }
        );
      }
      job = jobUser as Record<string, unknown>;
    } else {
      job = jobAdmin as Record<string, unknown> | null;
    }
  } catch (e) {
    console.error("[job-guides/format] job fetch error", e);
    return NextResponse.json(
      { error: "job_fetch_failed", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }

  if (!job) {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }

  const jobInput: JobInput = {
    title: (job.title as string) ?? null,
    location_text: (job.location_text as string) ?? null,
    source_name: (job.source_name as string) ?? null,
    source_url: (job.source_url as string) ?? null,
    snippet: (job.snippet as string) ?? null,
    published_at: (job.published_at as string) ?? null,
  };

  const result = await formatJobGuideWithGemini(jobInput, body.answers);

  if (result.ok) {
    return NextResponse.json({
      formatted: result.data,
      source: result.source,
    });
  }

  return NextResponse.json({
    formatted: result.fallback,
    source: "fallback",
    error: result.error,
  });
}
