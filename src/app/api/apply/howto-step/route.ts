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

type StepBody = {
  job_id: string;
  session_id: string;
  step: number;
  approved: boolean;
  derived: { source_key: string; country: string | null; country_code: string | null };
  answers?: Record<string, unknown>;
};

/**
 * POST /api/apply/howto-step
 * Body: { job_id, session_id, step, approved: true, derived }
 * Server fetches FULL job, POSTs to n8n webhook with step payload, returns webhook response.
 * Auth required.
 */
export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[apply/howto-step] SUPABASE env missing");
    return NextResponse.json(
      { error: "supabase_not_configured", detail: "Server env missing" },
      { status: 503 }
    );
  }

  const auth = await getUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: StepBody;
  try {
    // Read body once as text to avoid "Body has already been read" (e.g. if middleware/framework touched it)
    const raw = await req.text();
    body = raw ? (JSON.parse(raw) as StepBody) : ({} as StepBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobId = typeof body?.job_id === "string" ? body.job_id.trim() : "";
  const sessionId = typeof body?.session_id === "string" ? body.session_id.trim() : "";
  const step = typeof body?.step === "number" ? body.step : 0;
  const derived = body?.derived && typeof body.derived === "object"
    ? {
        source_key: String(body.derived.source_key ?? ""),
        country: body.derived.country != null ? String(body.derived.country) : null,
        country_code: body.derived.country_code != null ? String(body.derived.country_code) : null,
      }
    : { source_key: "OTHER", country: null as string | null, country_code: null as string | null };

  if (!jobId || !sessionId || step < 1 || step > 7) {
    return NextResponse.json(
      { error: "Bad request", detail: "job_id, session_id and step (1..7) required" },
      { status: 400 }
    );
  }

  if (!HOWTO_WEBHOOK_URL) {
    console.error("[apply/howto-step] N8N_HOWTO_WEBHOOK_URL not set");
    return NextResponse.json(
      { error: "webhook_not_configured", detail: "N8N_HOWTO_WEBHOOK_URL is not set" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: job, error: jobErr } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr) {
      console.error("[apply/howto-step] job_posts fetch error", jobId, jobErr);
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

    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const payload = {
      session_id: sessionId,
      step,
      approved: body.approved === true,
      job: job as Record<string, unknown>,
      derived,
      locale: "tr-TR",
      answers,
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
      console.warn("[apply/howto-step] webhook non-OK", jobId, step, webhookRes.status);
      const detailObj = webhookData && typeof webhookData === "object" && webhookData !== null
        ? (webhookData as Record<string, unknown>)
        : null;
      const detailMessage =
        typeof detailObj?.message === "string"
          ? detailObj.message
          : typeof detailObj?.error === "string"
            ? detailObj.error
            : typeof detailObj?.detail === "string"
              ? detailObj.detail
              : webhookRes.status === 502
                ? "Rehber servisi şu an yanıt vermiyor. Lütfen birkaç dakika sonra tekrar deneyin."
                : `Rehber servisi hata döndü (${webhookRes.status}).`;
      return NextResponse.json(
        {
          error: "webhook_error",
          status: webhookRes.status,
          detail: detailMessage,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(webhookData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[apply/howto-step] unexpected error", jobId, step, msg, err);
    return NextResponse.json(
      { error: "internal_error", detail: msg.slice(0, 200), requestedId: jobId },
      { status: 500 }
    );
  }
}
