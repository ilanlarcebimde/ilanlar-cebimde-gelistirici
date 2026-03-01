/**
 * POST /api/cover-letter
 *
 * Tek endpoint: İş Başvuru Mektubu wizard son adımı (final submission).
 * job_id varsa ilanlı, post_id varsa merkez, hiçbiri yoksa generic.
 * Step 1–5 client-only; sadece Step 6 bu API'yi çağırır.
 * Tüm akışlar: Premium Plus zorunlu, tek webhook contract.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import { isPremiumPlusSubscriptionActive } from "@/lib/premiumSubscription";
import {
  buildCoverLetterStep6Payload,
  ensureCoverLetterResponseUiNotes,
  type CoverLetterStep6Answers,
} from "@/lib/coverLetterWebhookContract";

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
  job_id?: string;
  post_id?: string;
  session_id?: string;
  locale?: string;
  answers?: Record<string, unknown>;
};

const REQUIRED_ANSWER_KEYS = [
  "role",
  "full_name",
  "email",
  "total_experience_years",
  "top_skills",
  "work_permit_status",
  "passport_status",
  "motivation",
] as const;

function validateAnswers(answers: Record<string, unknown>): { ok: true } | { ok: false; detail: string } {
  for (const k of REQUIRED_ANSWER_KEYS) {
    const v = answers[k];
    if (k === "top_skills") {
      if (!Array.isArray(v) || v.length < 2) {
        return { ok: false, detail: "En az 2 beceri gereklidir (top_skills)." };
      }
      continue;
    }
    if (v == null || String(v).trim() === "") {
      return { ok: false, detail: `Eksik alan: ${k}.` };
    }
  }
  const motivation = String(answers.motivation ?? "").trim();
  if (motivation.length > 400) {
    return { ok: false, detail: "Motivasyon en fazla 400 karakter olmalıdır." };
  }
  const email = String(answers.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, detail: "Geçerli bir e-posta adresi girin." };
  }
  return { ok: true };
}

async function fetchJobLikeFromJobId(supabase: ReturnType<typeof getSupabaseAdmin>, jobId: string): Promise<Record<string, unknown> | null> {
  const { data: job, error } = await supabase
    .from("job_posts")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !job) return null;
  return job as Record<string, unknown>;
}

async function fetchJobLikeFromPostId(supabase: ReturnType<typeof getSupabaseAdmin>, postId: string): Promise<Record<string, unknown> | null> {
  const { data: post, error: postErr } = await supabase
    .from("merkezi_posts")
    .select("id, title, company_name, country_slug, country_name, city, sector_slug, sector_name")
    .eq("id", postId)
    .eq("status", "published")
    .maybeSingle();
  if (postErr || !post) return null;

  const { data: contact } = await supabase
    .from("merkezi_post_contact")
    .select("contact_email, contact_phone, apply_url")
    .eq("post_id", postId)
    .maybeSingle();

  const locationText = [post.country_name ?? post.country_slug, post.city].filter(Boolean).join(", ");
  return {
    id: post.id,
    title: post.title,
    source_name: post.company_name ?? null,
    company_name: post.company_name ?? null,
    country: post.country_name ?? post.country_slug ?? null,
    location_text: locationText || null,
    application_email: contact?.contact_email ?? null,
    contact_email: contact?.contact_email ?? null,
  } as Record<string, unknown>;
}

export async function POST(req: NextRequest) {
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

  const hasPlus = await isPremiumPlusSubscriptionActive(auth.user.id);
  if (!hasPlus) {
    return NextResponse.json(
      { error: "premium_plus_required", detail: "Bu özellik Premium Plus abonelerine açıktır." },
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

  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
  if (!sessionId) {
    return NextResponse.json({ error: "Bad request", detail: "session_id required" }, { status: 400 });
  }

  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
  const validation = validateAnswers(answers);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "invalid_request", detail: validation.detail },
      { status: 400 }
    );
  }

  const jobId = typeof body.job_id === "string" ? body.job_id.trim() : "";
  const postId = typeof body.post_id === "string" ? body.post_id.trim() : "";
  const locale = typeof body.locale === "string" ? body.locale : "tr-TR";

  const supabase = getSupabaseAdmin();
  let job: Record<string, unknown> | undefined;

  if (jobId) {
    const fetched = await fetchJobLikeFromJobId(supabase, jobId);
    if (!fetched) {
      return NextResponse.json(
        { error: "job_not_found", detail: "Bu ilan artık yayında değil.", requestedId: jobId },
        { status: 404 }
      );
    }
    job = fetched;
  } else if (postId) {
    const fetched = await fetchJobLikeFromPostId(supabase, postId);
    if (!fetched) {
      return NextResponse.json(
        { error: "post_not_found", detail: "Bu içerik artık yayında değil.", requestedId: postId },
        { status: 404 }
      );
    }
    job = fetched;
  }

  const payload = buildCoverLetterStep6Payload({
    session_id: sessionId,
    answers: answers as CoverLetterStep6Answers,
    locale,
    job,
    derived: {},
  });

  try {
    const webhookRes = await fetch(LETTER_WEBHOOK_URL, {
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

    const normalized = ensureCoverLetterResponseUiNotes(webhookData);
    return NextResponse.json(normalized);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cover-letter] webhook error", msg);
    return NextResponse.json(
      { error: "webhook_error", detail: "Mektup servisi geçici olarak yanıt vermiyor." },
      { status: 502 }
    );
  }
}
