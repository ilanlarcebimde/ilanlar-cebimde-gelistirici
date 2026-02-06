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

    let update = supabase
      .from("assistant_sessions")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", body.sessionId);

    const { data, error } = body.userId
      ? await update.eq("user_id", body.userId).select("session_id, completed, completed_at").maybeSingle()
      : await update.select("session_id, completed, completed_at").maybeSingle();

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
        sessionId: data.session_id,
        completed: !!data.completed,
        completedAt: data.completed_at,
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
