import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Production webhook URL — .env.local (local) ve production env'de N8N_HOWTO_WEBHOOK_URL zorunlu. */
const HOWTO_WEBHOOK_URL = process.env.N8N_HOWTO_WEBHOOK_URL?.trim() || "";

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
 * POST /api/apply/howto
 * Body: { job_id: string }
 * Server fetches FULL job_posts record, POSTs to n8n howto webhook, returns webhook response.
 * Auth required (Bearer token).
 */
export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[apply/howto] SUPABASE env missing");
    return NextResponse.json(
      { error: "supabase_not_configured", detail: "Server env missing" },
      { status: 503 }
    );
  }

  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { job_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobId = typeof body?.job_id === "string" ? body.job_id.trim() : "";
  if (!jobId) {
    return NextResponse.json({ error: "Missing job_id" }, { status: 400 });
  }

  if (!HOWTO_WEBHOOK_URL) {
    console.error("[apply/howto] N8N_HOWTO_WEBHOOK_URL not set");
    return NextResponse.json(
      { error: "webhook_not_configured", detail: "N8N_HOWTO_WEBHOOK_URL is not set" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    // Full job record: all columns (id, channel_id, title, position_text, location_text, source_name, source_url, snippet, image_url, published_at, status, created_at, analysis_status, analysis_json)
    const { data: job, error: jobErr } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr) {
      console.error("[apply/howto] job_posts fetch error", jobId, jobErr);
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

    const payload = {
      job: job as Record<string, unknown>,
      request: {
        intent: "how_to_apply",
        locale: "tr-TR",
        mode: "full",
        version: 1,
      },
    };

    const webhookRes = await fetch(HOWTO_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      console.warn("[apply/howto] webhook non-OK", jobId, webhookRes.status, String(webhookData).slice(0, 300));
      return NextResponse.json(
        {
          error: "webhook_error",
          status: webhookRes.status,
          detail: webhookData,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(webhookData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[apply/howto] unexpected error", jobId, msg, err);
    return NextResponse.json(
      { error: "internal_error", detail: msg.slice(0, 200), requestedId: jobId },
      { status: 500 }
    );
  }
}
