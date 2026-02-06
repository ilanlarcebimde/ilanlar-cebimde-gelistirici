import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  userId?: string;
  target?: { role?: string; country?: string };
  sessionId?: string;
};

function newSessionId() {
  return `va_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const sessionId =
      (body.sessionId && String(body.sessionId).trim()) || newSessionId();
    const userId = body.userId ? String(body.userId).trim() : null;

    const supabase = getSupabaseAdmin();

    const initialCv: Record<string, unknown> = {};
    if (body.target?.role) initialCv["target_role"] = body.target.role;
    if (body.target?.country) initialCv["target_country"] = body.target.country;

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("assistant_sessions")
      .insert({
        session_id: sessionId,
        user_id: userId,
        cv_json: initialCv,
        filled_keys: [],
        completed: false,
        completed_at: null,
        created_at: now,
        updated_at: now,
      })
      .select("session_id, cv_json, filled_keys, completed, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "create_failed", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        session: {
          sessionId: data.session_id,
          cv: data.cv_json ?? {},
          filledKeys: data.filled_keys ?? [],
          completed: !!data.completed,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
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
