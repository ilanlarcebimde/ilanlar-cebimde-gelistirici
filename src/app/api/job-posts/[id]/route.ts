import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Tek ilan + rehber alanları. Sadece published ilanlar; analysis_json/analysis_status okuma.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("job_posts")
    .select(
      "id, title, position_text, location_text, source_name, source_url, snippet, published_at, analysis_status, analysis_json"
    )
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
