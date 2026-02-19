import { NextResponse } from "next/server";
import { getSupabaseForUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = { channelSlug?: string };

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const channelSlug = typeof body.channelSlug === "string" ? body.channelSlug.trim() : null;
    if (!channelSlug) {
      return NextResponse.json({ error: "channelSlug required" }, { status: 400 });
    }

    const supabase = getSupabaseForUser(token);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("id")
      .eq("slug", channelSlug)
      .eq("is_active", true)
      .single();

    if (channelError || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const { error: insertError } = await supabase
      .from("channel_subscriptions")
      .upsert(
        { user_id: user.id, channel_id: channel.id },
        { onConflict: "user_id,channel_id", ignoreDuplicates: true }
      );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, channelSlug });
  } catch (e) {
    console.error("subscriptions/ensure:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
