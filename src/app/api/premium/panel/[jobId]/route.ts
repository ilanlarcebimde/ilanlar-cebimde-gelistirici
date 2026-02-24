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

/** Temel kolonlar (migration 011); analysis_status/analysis_json (022) yoksa sorgu yine çalışır. */
const JOB_COLS = "id, title, position_text, location_text, source_name, source_url, snippet, published_at";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[premium/panel] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.json(
      { error: "supabase_admin_not_configured", detail: "Server env missing" },
      { status: 503 }
    );
  }

  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = (await params).jobId;
    const jobId = typeof raw === "string" ? raw.trim() : "";
    if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

    let admin;
    try {
      admin = getSupabaseAdmin();
    } catch (adminErr) {
      console.error("[premium/panel] getSupabaseAdmin failed", adminErr);
      return NextResponse.json(
        { error: "supabase_admin_not_configured", detail: adminErr instanceof Error ? adminErr.message : "Unknown" },
        { status: 503 }
      );
    }
    let job: Record<string, unknown> | null = null;
    const { data: jobAdmin, error: jobErr } = await admin
      .from("job_posts")
      .select(JOB_COLS)
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr) {
      console.warn("[premium/panel] job_posts admin query failed, trying with user client", jobId, jobErr.message);
      const { data: jobUser, error: jobUserErr } = await auth.supabase
        .from("job_posts")
        .select(JOB_COLS)
        .eq("id", jobId)
        .eq("status", "published")
        .maybeSingle();
      if (jobUserErr || !jobUser) {
        console.error("[premium/panel] job_posts query error", jobId, jobErr);
        return NextResponse.json(
          { error: "job_posts_fetch_failed", detail: (jobUserErr ?? jobErr).message?.slice(0, 200) ?? "Unknown", requestedId: jobId },
          { status: 500 }
        );
      }
      job = jobUser as Record<string, unknown>;
    } else {
      job = jobAdmin as Record<string, unknown> | null;
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
          console.error("[premium/panel] job_guides insert error", jobId, insertErr);
          return NextResponse.json(
            { error: "job_guides_insert_failed", detail: insertErr.message?.slice(0, 200) ?? "Unknown", requestedId: jobId },
            { status: 500 }
          );
        }
      } else {
        guide = created;
      }
    }

    const chatMessages: Array<{ role: "user" | "assistant"; text: string; ts: string; next_question?: { text: string; choices?: string[] }; next_questions?: unknown }> = [];
    if (guide) {
      const { data: events } = await auth.supabase
        .from("job_guide_events")
        .select("type, content, created_at")
        .eq("job_guide_id", guide.id)
        .in("type", ["user_message", "assistant_message"])
        .order("created_at", { ascending: true });
      if (events?.length) {
        for (const e of events) {
          if (e.type === "user_message") {
            chatMessages.push({ role: "user", text: e.content || "", ts: e.created_at });
          } else if (e.type === "assistant_message") {
            try {
              const parsed = JSON.parse(e.content || "{}") as { message?: string; next_question?: { text: string; choices?: string[] }; next_questions?: unknown };
              chatMessages.push({
                role: "assistant",
                text: parsed.message ?? e.content ?? "",
                ts: e.created_at,
                next_question: parsed.next_question,
                next_questions: parsed.next_questions,
              });
            } catch {
              chatMessages.push({ role: "assistant", text: e.content ?? "", ts: e.created_at });
            }
          }
        }
      }
    }

    return NextResponse.json({ job, guide, chat_messages: chatMessages });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[premium/panel] unexpected error", message, err);
    return NextResponse.json(
      { error: "internal_error", detail: message.slice(0, 200) },
      { status: 500 }
    );
  }
}
