import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  sessionId: string;
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.sessionId) {
      return NextResponse.json({ error: "sessionId_required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("assistant_sessions")
      .select(
        "session_id, user_id, cv_json, filled_keys, completed, completed_at, updated_at, created_at"
      )
      .eq("session_id", body.sessionId)
      .limit(1);

    if (body.userId) {
      query = query.eq("user_id", body.userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "db_failed", detail: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        session: {
          sessionId: data.session_id,
          userId: data.user_id,
          cv: data.cv_json ?? {},
          filledKeys: data.filled_keys ?? [],
          completed: !!data.completed,
          completedAt: data.completed_at,
          updatedAt: data.updated_at,
          createdAt: data.created_at,
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
