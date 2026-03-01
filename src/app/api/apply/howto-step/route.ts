import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseForUser } from "@/lib/supabase/server";
import { isPremiumSubscriptionActive, isPremiumPlusSubscriptionActive } from "@/lib/premiumSubscription";

export const runtime = "nodejs";

const HOWTO_WEBHOOK_URL = process.env.N8N_HOWTO_WEBHOOK_URL?.trim() || "";
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

type StepBody = {
  job_id?: string;
  session_id: string;
  step: number;
  approved: boolean;
  derived?: {
    source_key?: string;
    country?: string;
    country_code?: string;
    mode?: "job_specific" | "generic";
  };
  answers?: Record<string, unknown>;
  intent?: "howto_apply" | "cover_letter_generate";
  locale?: string;
};

const COVER_LETTER_STEPS = 6;

function validateCoverLetterStep(step: number, body: StepBody): { ok: true } | { ok: false; error: string; details?: Record<string, string> } {
  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
  const derived = body.derived && typeof body.derived === "object" ? body.derived : {};

  switch (step) {
    case 1: {
      const mode = derived.mode;
      if (mode !== "job_specific" && mode !== "generic") {
        return { ok: false, error: "invalid_request", details: { derived_mode: "derived.mode (job_specific | generic) gereklidir." } };
      }
      return { ok: true };
    }
    case 2: {
      const fullName = answers.full_name;
      const email = answers.email;
      const missing: string[] = [];
      if (fullName == null || String(fullName).trim() === "") missing.push("answers.full_name");
      if (email == null || String(email).trim() === "") missing.push("answers.email");
      if (missing.length) {
        return { ok: false, error: "invalid_request", details: { missing: missing.join(", ") } };
      }
      return { ok: true };
    }
    case 3: {
      const years = answers.total_experience_years;
      const skills = answers.top_skills;
      const missing: string[] = [];
      if (years == null) missing.push("answers.total_experience_years");
      if (!Array.isArray(skills) || skills.length < 2) {
        missing.push("answers.top_skills (en az 2 öğe)");
      }
      if (missing.length) {
        return { ok: false, error: "invalid_request", details: { missing: missing.join(", ") } };
      }
      return { ok: true };
    }
    case 4: {
      const workPermit = answers.work_permit_status;
      const passport = answers.passport_status;
      const missing: string[] = [];
      if (workPermit == null || String(workPermit).trim() === "") missing.push("answers.work_permit_status");
      if (passport == null || String(passport).trim() === "") missing.push("answers.passport_status");
      if (missing.length) {
        return { ok: false, error: "invalid_request", details: { missing: missing.join(", ") } };
      }
      return { ok: true };
    }
    case 5: {
      const motivation = answers.motivation;
      if (motivation == null || String(motivation).trim() === "") {
        return { ok: false, error: "invalid_request", details: { answers_motivation: "answers.motivation gereklidir." } };
      }
      if (String(motivation).length > 400) {
        return { ok: false, error: "invalid_request", details: { answers_motivation: "answers.motivation en fazla 400 karakter olmalıdır." } };
      }
      return { ok: true };
    }
    case 6: {
      const required = ["full_name", "email", "total_experience_years", "top_skills", "work_permit_status", "passport_status", "motivation"];
      const missing = required.filter((k) => {
        const v = answers[k];
        if (k === "top_skills") return !Array.isArray(v) || v.length < 2;
        return v == null || String(v).trim() === "";
      });
      if (missing.length) {
        return { ok: false, error: "invalid_request", details: { missing: "Step 2–5 verileri eksik: " + missing.join(", ") } };
      }
      return { ok: true };
    }
    default:
      return { ok: false, error: "invalid_request", details: { step: "step 1..6 olmalıdır." } };
  }
}

/** Genel mektup (ilan bağımsız): job_id yok, sadece answers ile validation. */
function validateCoverLetterStepGeneric(step: number, body: StepBody): { ok: true } | { ok: false; error: string; details?: Record<string, string> } {
  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

  switch (step) {
    case 1: {
      const role = answers.role;
      if (role == null || String(role).trim() === "") {
        return { ok: false, error: "invalid_request", details: { answers_role: "answers.role gereklidir." } };
      }
      return { ok: true };
    }
    case 2: {
      const fullName = answers.full_name;
      const email = answers.email;
      const missing: string[] = [];
      if (fullName == null || String(fullName).trim() === "") missing.push("answers.full_name");
      if (email == null || String(email).trim() === "") missing.push("answers.email");
      if (missing.length) {
        return { ok: false, error: "invalid_request", details: { missing: missing.join(", ") } };
      }
      return { ok: true };
    }
    case 3: {
      const years = answers.total_experience_years;
      const skills = answers.top_skills;
      const missing: string[] = [];
      if (years == null) missing.push("answers.total_experience_years");
      if (!Array.isArray(skills) || skills.length < 2) missing.push("answers.top_skills (en az 2 öğe)");
      if (missing.length) {
        return { ok: false, error: "invalid_request", details: { missing: missing.join(", ") } };
      }
      return { ok: true };
    }
    case 4: {
      const workPermit = answers.work_permit_status;
      const passport = answers.passport_status;
      const missing: string[] = [];
      if (workPermit == null || String(workPermit).trim() === "") missing.push("answers.work_permit_status");
      if (passport == null || String(passport).trim() === "") missing.push("answers.passport_status");
      if (missing.length) {
        return { ok: false, error: "invalid_request", details: { missing: missing.join(", ") } };
      }
      return { ok: true };
    }
    case 5: {
      const motivation = answers.motivation;
      if (motivation == null || String(motivation).trim() === "") {
        return { ok: false, error: "invalid_request", details: { answers_motivation: "answers.motivation gereklidir." } };
      }
      if (String(motivation).length > 400) {
        return { ok: false, error: "invalid_request", details: { answers_motivation: "answers.motivation en fazla 400 karakter." } };
      }
      return { ok: true };
    }
    case 6: {
      const required = ["role", "full_name", "email", "total_experience_years", "top_skills", "work_permit_status", "passport_status", "motivation"];
      const missing = required.filter((k) => {
        const v = answers[k];
        if (k === "top_skills") return !Array.isArray(v) || v.length < 2;
        return v == null || String(v).trim() === "";
      });
      if (missing.length) {
        return { ok: false, error: "invalid_request", details: { missing: "Step 1–5 verileri eksik: " + missing.join(", ") } };
      }
      return { ok: true };
    }
    default:
      return { ok: false, error: "invalid_request", details: { step: "step 1..6 olmalıdır." } };
  }
}

/**
 * POST /api/apply/howto-step
 * Body: { job_id, session_id, step, approved, derived?, answers?, intent?, locale? }
 * intent yoksa "howto_apply". intent="cover_letter_generate" => 6 adım başvuru mektubu sihirbazı (Premium Plus, step 6'da n8n).
 * Auth required. howto => Premium; cover_letter => Premium Plus.
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
    const raw = await req.text();
    body = raw ? (JSON.parse(raw) as StepBody) : ({} as StepBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const intent = body.intent === "cover_letter_generate" ? "cover_letter_generate" : "howto_apply";

  if (intent === "cover_letter_generate") {
    const hasPlus = await isPremiumPlusSubscriptionActive(auth.user.id);
    if (!hasPlus) {
      return NextResponse.json(
        { error: "premium_plus_required", message: "Bu özellik Premium Plus abonelerine açıktır." },
        { status: 403 }
      );
    }
  } else {
    const hasActivePremium = await isPremiumSubscriptionActive(auth.user.id);
    if (!hasActivePremium) {
      return NextResponse.json(
        { error: "premium_required", detail: "Haftalık premium aboneliğiniz yok veya süresi dolmuş. Erişim için abonelik gereklidir." },
        { status: 403 }
      );
    }
  }

  const jobId = typeof body?.job_id === "string" ? body.job_id.trim() : "";
  const sessionId = typeof body?.session_id === "string" ? body.session_id.trim() : "";
  const step = typeof body?.step === "number" ? body.step : 0;
  const derived = body?.derived && typeof body.derived === "object"
    ? {
        source_key: String(body.derived.source_key ?? ""),
        country: body.derived.country != null ? String(body.derived.country) : null,
        country_code: body.derived.country_code != null ? String(body.derived.country_code) : null,
        mode: body.derived.mode === "job_specific" || body.derived.mode === "generic" ? body.derived.mode : undefined,
      }
    : { source_key: "OTHER", country: null as string | null, country_code: null as string | null };

  const stepMin = intent === "cover_letter_generate" ? 1 : 1;
  const stepMax = intent === "cover_letter_generate" ? COVER_LETTER_STEPS : 7;

  if (!sessionId || step < stepMin || step > stepMax) {
    return NextResponse.json(
      { error: "Bad request", detail: `session_id and step (${stepMin}..${stepMax}) required` },
      { status: 400 }
    );
  }

  if (intent === "howto_apply" && !jobId) {
    return NextResponse.json(
      { error: "Bad request", detail: "job_id required for howto_apply" },
      { status: 400 }
    );
  }

  // Cover letter: n8n sadece metin üretir; PDF/storage yok.
  // KRİTİK: Bu branch'te job_posts SADECE ilanlı dalda (jobId var) sorgulanır. Generic dalda 0 job lookup, 0 job_not_found.
  if (intent === "cover_letter_generate") {
    const isGeneric = !jobId; // job_id boş/undefined => genel mektup; body'de gelse bile generic'te ignore

    if (isGeneric) {
      // Genel mektup: job'a hiç dokunulmaz, 404/job_not_found imkânsız. (job_id body'de gelse bile kullanılmaz.)
      if (process.env.NODE_ENV !== "production") {
        console.log("[apply/howto-step] cover_letter_generate generic flow (job_id ignored)");
      }
      const validation = validateCoverLetterStepGeneric(step, body);
      if (!validation.ok) {
        return NextResponse.json(
          { error: validation.error, detail: "Validation failed", details: validation.details },
          { status: 400 }
        );
      }
      if (step < COVER_LETTER_STEPS) {
        return NextResponse.json({
          type: "cover_letter_progress",
          status: "ok",
          next_step: step + 1,
        });
      }
      if (!LETTER_WEBHOOK_URL) {
        return NextResponse.json(
          { error: "webhook_not_configured", detail: "N8N_LETTER_WEBHOOK_URL is not set" },
          { status: 503 }
        );
      }
      const letterPayload = {
        intent: "cover_letter_generate",
        session_id: sessionId,
        step: 6,
        approved: body.approved === true,
        locale: body.locale ?? "tr-TR",
        answers: body.answers ?? {},
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
      console.error("[apply/howto-step] cover_letter generic step 6 error", step, msg, err);
      return NextResponse.json(
        { error: "internal_error", detail: msg.slice(0, 200) },
        { status: 500 }
      );
    }

    // İlanlı mektup (job_id var) — sadece bu dalda job_posts sorgulanır; generic dalı yukarıda return etti.
    const validation = validateCoverLetterStep(step, body);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error, detail: "Validation failed", details: validation.details },
        { status: 400 }
      );
    }

    if (step < COVER_LETTER_STEPS) {
      return NextResponse.json({
        type: "cover_letter_progress",
        status: "ok",
        next_step: step + 1,
      });
    }

    if (!LETTER_WEBHOOK_URL) {
      console.error("[apply/howto-step] N8N_LETTER_WEBHOOK_URL not set");
      return NextResponse.json(
        { error: "webhook_not_configured", detail: "N8N_LETTER_WEBHOOK_URL is not set" },
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
          { error: "job_posts_fetch_failed", detail: jobErr.message?.slice(0, 200) ?? "Unknown", requestedId: jobId },
          { status: 500 }
        );
      }

      if (!job) {
        return NextResponse.json(
          { error: "job_not_found", requestedId: jobId },
          { status: 404 }
        );
      }

      const letterPayload = {
        intent: "cover_letter_generate",
        session_id: sessionId,
        step,
        approved: body.approved === true,
        locale: body.locale ?? "tr-TR",
        job: job as Record<string, unknown>,
        derived: body.derived ?? {},
        answers: body.answers ?? {},
        request: { version: 1 },
      };

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
        console.warn("[apply/howto-step] letter webhook non-OK", jobId, step, webhookRes.status);
        const detailObj = webhookData && typeof webhookData === "object" && webhookData !== null
          ? (webhookData as Record<string, unknown>)
          : null;
        const status = webhookRes.status;
        const fallback =
          status >= 500
            ? "Mektup servisi geçici olarak yanıt vermiyor. Lütfen tekrar deneyin."
            : typeof detailObj?.message === "string"
              ? detailObj.message
              : typeof detailObj?.error === "string"
                ? detailObj.error
                : typeof detailObj?.detail === "string"
                  ? detailObj.detail
                  : `Webhook hata (${status}).`;
        return NextResponse.json(
          { error: "webhook_error", status: webhookRes.status, detail: fallback },
          { status: 502 }
        );
      }

      return NextResponse.json(webhookData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[apply/howto-step] cover_letter step 6 error", jobId, step, msg, err);
      return NextResponse.json(
        { error: "internal_error", detail: msg.slice(0, 200), requestedId: jobId },
        { status: 500 }
      );
    }
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
        { error: "job_not_found", requestedId: jobId },
        { status: 404 }
      );
    }

    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const payload = {
      session_id: sessionId,
      step,
      approved: body.approved === true,
      job: job as Record<string, unknown>,
      derived: {
        source_key: derived.source_key,
        country: derived.country,
        country_code: derived.country_code,
      },
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
      const status = webhookRes.status;
      const fallback5xx =
        status >= 500
          ? "Rehber servisi geçici olarak yanıt vermiyor. Lütfen birkaç dakika sonra «Tekrar dene» ile yeniden deneyin."
          : `Rehber servisi hata döndü (${status}).`;
      const detailMessage =
        typeof detailObj?.message === "string"
          ? detailObj.message
          : typeof detailObj?.error === "string"
            ? detailObj.error
            : typeof detailObj?.detail === "string"
              ? detailObj.detail
              : fallback5xx;
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
