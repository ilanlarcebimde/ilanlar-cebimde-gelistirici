import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { applyFieldRulesToCv } from "@/lib/assistant/applyFieldRules";

export const runtime = "nodejs";

type Body = {
  sessionId: string;
  userId?: string;
  cv: Record<string, unknown>;
  updates: Array<{ key: string; value: unknown }>;
  allowedKeys: string[];
  fieldRules: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.sessionId) {
      return NextResponse.json({ error: "sessionId_required" }, { status: 400 });
    }
    if (!body?.allowedKeys?.length || !body?.fieldRules) {
      return NextResponse.json({ error: "rules_required" }, { status: 400 });
    }
    if (!Array.isArray(body.updates) || body.updates.length === 0) {
      return NextResponse.json({ error: "updates_required" }, { status: 400 });
    }

    const applied = applyFieldRulesToCv({
      cv: body.cv ?? {},
      updates: body.updates,
      fieldRules: body.fieldRules as Parameters<typeof applyFieldRulesToCv>[0]["fieldRules"],
      allowedKeys: body.allowedKeys,
    });

    const hasHardError = applied.issues.some((i) => i.type === "error");
    if (hasHardError) {
      return NextResponse.json(
        { error: "validation_failed", issues: applied.issues },
        { status: 422 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("cv_sessions")
      .upsert(
        {
          session_id: body.sessionId,
          user_id: body.userId ?? null,
          cv_json: applied.cv,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      )
      .select("session_id, cv_json, updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "db_failed", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        sessionId: data.session_id,
        cv: data.cv_json,
        issues: applied.issues,
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const msg = String(e instanceof Error ? e.message : "unknown").slice(0, 180);
    return NextResponse.json(
      { error: "internal_error", detail: msg },
      { status: 500 }
    );
  }
}
