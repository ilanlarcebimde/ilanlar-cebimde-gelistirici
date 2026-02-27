import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";

/** GET: Kullanıcı admin mi? Cookie session üzerinden. */
export async function GET(req: NextRequest) {
  void req;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ admin: false }, { status: 200 });

  const { data: adminRow } = await supabase
    .from("app_admin")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ admin: !!adminRow });
}
