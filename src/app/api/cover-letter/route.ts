/**
 * POST /api/cover-letter
 *
 * Tek endpoint: İş Başvuru Mektubu wizard son adımı (final submission).
 * Form verileri n8n webhook URL'ine POST edilir.
 * Merkezi ücretli ilan (post_id + is_paid): haftalık 99 TL Premium gerekir (Firma İletişim ile aynı).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import { isPremiumSubscriptionActive } from "@/lib/premiumSubscription";
import {
  buildCoverLetterStep6Payload,
  ensureCoverLetterResponseUiNotes,
  type CoverLetterStep6Answers,
} from "@/lib/coverLetterWebhookContract";

export const runtime = "nodejs";

const DEFAULT_WEBHOOK_URL = "https://s02c0alq.rcld.app/webhook/3b4796b7-7556-415d-81af-7d55664e9c59";
const LETTER_WEBHOOK_URL = process.env.N8N_LETTER_WEBHOOK_URL?.trim() || DEFAULT_WEBHOOK_URL;

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.replace(/\?.*$/, "?...").replace(/#.*$/, "#...");
  }
}

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
  console.log("[API] /api/cover-letter hit", { ts: Date.now() });

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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
  const jobId = typeof body.job_id === "string" ? body.job_id.trim() : "";
  const postId = typeof body.post_id === "string" ? body.post_id.trim() : "";
  const locale = typeof body.locale === "string" ? body.locale : "tr-TR";
  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

  if (!sessionId) {
    return NextResponse.json({ error: "Bad request", detail: "session_id required" }, { status: 400 });
  }

  const validation = validateAnswers(answers);
  if (!validation.ok) {
    console.log("[API] validation_failed", { detail: validation.detail });
    return NextResponse.json(
      { error: "invalid_request", detail: validation.detail },
      { status: 400 }
    );
  }

  console.log("[API] parsed", {
    session_id: sessionId,
    locale,
    hasJobId: !!jobId,
    hasPostId: !!postId,
    answersKeys: Object.keys(answers),
    skillsLen: Array.isArray(answers.top_skills) ? answers.top_skills.length : 0,
  });

  if (postId) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: postRow } = await supabaseAdmin
      .from("merkezi_posts")
      .select("is_paid")
      .eq("id", postId)
      .eq("status", "published")
      .maybeSingle();
    if (postRow?.is_paid) {
      const hasPremium = await isPremiumSubscriptionActive(auth.user.id);
      if (!hasPremium) {
        return NextResponse.json(
          { error: "premium_required", detail: "Bu özellik için haftalık Premium (99 TL) aboneliği gereklidir." },
          { status: 403 }
        );
      }
    }
  }

  let job: Record<string, unknown> | undefined;
  const supabase = getSupabaseAdmin();
  if (jobId) {
    const fetched = await fetchJobLikeFromJobId(supabase, jobId);
    if (fetched) job = fetched;
    // job bulunamasa bile devam et; test aşamasında sadece answers ile webhook'a gönder.
  }
  if (!job && postId) {
    const fetched = await fetchJobLikeFromPostId(supabase, postId);
    if (fetched) job = fetched;
  }

  const payload = buildCoverLetterStep6Payload({
    session_id: sessionId,
    answers: answers as CoverLetterStep6Answers,
    locale,
    job,
    derived: {},
  });

  const targetUrl = LETTER_WEBHOOK_URL;

  console.log("[API] posting_n8n", {
    targetUrl: maskUrl(targetUrl),
    session_id: sessionId,
    step: 6,
  });

  try {
    const webhookRes = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await webhookRes.text();

    console.log("[API] n8n_done", {
      status: webhookRes.status,
      bodyPreview: text.slice(0, 200),
    });

    if (!webhookRes.ok) {
      let fallback = "Mektup servisi geçici olarak yanıt vermiyor.";
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        fallback =
          (typeof parsed?.message === "string" ? parsed.message : null) ??
          (typeof parsed?.detail === "string" ? parsed.detail : null) ??
          (typeof parsed?.error === "string" ? parsed.error : null) ??
          fallback;
      } catch {
        fallback = text.slice(0, 150) || fallback;
      }
      return NextResponse.json(
        { error: "webhook_error", detail: fallback },
        { status: 502 }
      );
    }

    let webhookData: unknown;
    try {
      webhookData = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "webhook_invalid_json", detail: text.slice(0, 150) },
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
